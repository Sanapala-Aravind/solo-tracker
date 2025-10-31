from django.db import models

class ActivityCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Activity(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    category = models.ForeignKey(ActivityCategory, on_delete=models.CASCADE, related_name="activities")
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    # Optional: if user prefers to store just a duration (in minutes) instead of start/end.
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    reminder_time = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.category.name})"
