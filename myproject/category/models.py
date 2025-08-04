from django.db import models

# Create your models here.
class Category(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, null=False, blank=False, unique=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children'
    )

    class Meta:
        db_table = 'category'

    def __str__(self):
        return self.name