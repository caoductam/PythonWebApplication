from django.db import models

# Create your models here.
class Document(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    file_path = models.CharField(max_length=512)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.BigIntegerField()
    category_id = models.ForeignKey('category.Category', on_delete=models.CASCADE, related_name='files')
    created_by = models.ForeignKey('user.User', on_delete=models.CASCADE, related_name='files')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'document'

    def __str__(self):
        return self.title