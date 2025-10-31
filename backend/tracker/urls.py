from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ActivityCategoryViewSet, ActivityViewSet

router = DefaultRouter()
router.register(r"categories", ActivityCategoryViewSet, basename="category")
router.register(r"activities", ActivityViewSet, basename="activity")

urlpatterns = [
    path("", include(router.urls)),
]
