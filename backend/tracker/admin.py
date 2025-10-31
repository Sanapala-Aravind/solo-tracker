from django.contrib import admin
from .models import ActivityCategory, Activity

@admin.register(ActivityCategory)
class ActivityCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "start_time", "end_time", "reminder_time", "completed")
    list_filter = ("category", "completed")
    search_fields = ("title", "description")
