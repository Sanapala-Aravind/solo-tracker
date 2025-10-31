from rest_framework import serializers
from .models import Activity, ActivityCategory

class ActivityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityCategory
        fields = ["id", "name"]

class ActivitySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id", "title", "description", "category", "category_name",
            "start_time", "end_time", "duration_minutes", "reminder_time", "completed",
            "created_at", "updated_at"
        ]
