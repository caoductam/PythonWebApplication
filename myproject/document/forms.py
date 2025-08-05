from django import forms
from .models import Document, Category, User

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = [
            'title',
            'description',
            'file_path',
            'file_name',
            'file_type',
            'file_size',
            'category_id',
            'created_by',
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
            'category_id': forms.Select(),
            'created_by': forms.Select(),
        }