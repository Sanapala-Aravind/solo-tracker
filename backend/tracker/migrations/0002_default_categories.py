from django.db import migrations

def seed_categories(apps, schema_editor):
    ActivityCategory = apps.get_model('tracker', 'ActivityCategory')
    defaults = ['Work', 'Personal', 'Health', 'Study']
    if ActivityCategory.objects.count() == 0:
        for name in defaults:
            ActivityCategory.objects.create(name=name)

class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories, reverse_code=migrations.RunPython.noop),
    ]
