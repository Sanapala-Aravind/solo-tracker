from datetime import datetime, timedelta
from django.utils.dateparse import parse_date
from django.utils.timezone import make_aware, get_current_timezone
from django.db.models import Q, Sum, F, ExpressionWrapper, DurationField
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Activity, ActivityCategory
from .serializers import ActivitySerializer, ActivityCategorySerializer
from .ai import get_suggestions

class ActivityCategoryViewSet(viewsets.ModelViewSet):
    queryset = ActivityCategory.finder if hasattr(ActivityCategory, "finder") else ActivityCategory.objects.all()
    serializer_class = ActivityCategorySerializer

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related("category").all().order_by("-start_time", "-created_at")
    serializer_class = ActivitySerializer

    @action(detail=False, methods=["get"], url_path="by-date")
    def by_date(self, request):
        date_str = request.query_params.get("date")
        category_id = request.query_params.get("category")
        tz = get_current_timezone()

        if not date_str:
            return Response({"detail": "Missing 'date' query param YYYY-MM-DD."}, status=400)
        day = parse_date(date_str)
        if not day:
            return Response({"detail": "Invalid 'date' format. Use YYYY-MM-DD."}, status=400)

        start_dt = make_aware(datetime.combine(day, datetime.min.time()), timezone=tz)
        end_dt = start_dt + timedelta(days=1)

        qs = self.get_queryset().filter(
            Q(start_time__gte=start_dt, start_time__lt=end_dt) |
            Q(end_time__gte=start_dt, end_time__lt=end_dt) |
            Q(created_at__gte=start_dt, created_at__lt=end_dt)
        )
        if category_id:
            qs = qs.filter(category_id=category_id)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="toggle-complete")
    def toggle_complete(self, request, pk=None):
        obj = self.get_object()
        obj.completed = not obj.completed
        obj.save(update_fields=["completed", "updated_at"])
        return Response({"id": obj.id, "completed": obj.completed})

    @action(detail=False, methods=["get"], url_path="stats-today")
    def stats_today(self, request):
        # Handy aggregate endpoint for progress bars.
        tz = get_current_timezone()
        today = datetime.now(tz).date()
        start_dt = tz.localize(datetime.combine(today, datetime.min.time()))
        end_dt = start_dt + timedelta(days=1)

        # duration: prefer end - start if both present, else duration_minutes
        duration_expr = ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())

        qs = self.get_queryset().filter(
            Q(start_time__gte=start_dt, start_time__lt=end_dt) |
            Q(end_time__gte=start_dt, end_time__lt=end_dt) |
            Q(created_at__gte=start_dt, created_at__lt=end_dt)
        )

        data = []
        for cat in ActivityCategory.objects.all():
            cat_qs = qs.filter(category=cat)
            # Sum naive durations
            total_seconds = 0
            for a in cat_qs:
                if a.start_time and a.end_time:
                    total_seconds += max(0, (a.end_time - a.start_time).total_seconds())
                elif a.duration_minutes:
                    total_seconds += a.duration_minutes * 60
            data.append({"category": {"id": cat.id, "name": cat.name}, "seconds": total_seconds})
        return Response(data)


    @action(detail=False, methods=["get"], url_path="ai_suggestions")
    def ai_suggestions(self, request):
        """
        GET /api/activities/ai_suggestions/?date=YYYY-MM-DD
        """
        tz = get_current_timezone()
        date_str = request.query_params.get("date") or datetime.now(tz).date().isoformat()

        day = parse_date(date_str)
        if not day:
            return Response({"error": "Invalid date"}, status=400)

        # ✅ FIX: use make_aware (tz.localize breaks with zoneinfo)
        start_dt = make_aware(datetime.combine(day, datetime.min.time()), tz)
        end_dt   = start_dt + timedelta(days=1)

        qs = Activity.objects.select_related("category").filter(
            (Q(start_time__lt=end_dt) & Q(end_time__gte=start_dt)) |
            (Q(duration_minutes__isnull=False) & Q(updated_at__range=(start_dt, end_dt)))
        ).order_by("-created_at")

        rows = [{
            "title": a.title,
            "category_name": a.category.name if a.category_id else "",
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None,
            "duration_minutes": a.duration_minutes,
            "completed": a.completed,
        } for a in qs]

        # If you want to handle empty data gracefully:
        # if not rows:
        #     return Response({"date": date_str, "count": 0, "suggestions": "No activities today — add a few tasks and try again."})

        try:
            text = get_suggestions(date_str, rows)
        except Exception as e:
            # More transparent error back to the UI
            return Response({"error": f"LLM call failed: {e}"}, status=502)

        return Response({"date": date_str, "count": len(rows), "suggestions": text})