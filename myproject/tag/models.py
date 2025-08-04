from django.db import models

# Create your models here.
class Tag(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, null=False, blank=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tag'  # Đặt tên bảng đúng với DB nếu cần

    def __str__(self):
        return self.name