from django.db import models

# Create your models here.
class User(models.Model):
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    role = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user'  # Tên bảng trong database

    def __str__(self):
        return self.username