from django import forms
from .models import User

class UserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, max_length=255)
    
    class Meta:
        model = User
        fields = [
            'username',
            'password',
            'full_name',
            'email',
            'role',
            'is_active',
        ]
        widgets = {
            'password': forms.PasswordInput(),
            'email': forms.EmailInput(attrs={'placeholder': 'Email'}),
            'is_active': forms.CheckboxInput(),
            'role': forms.Select(choices=[
                ('admin', 'Admin'),
                ('editor', 'Editor'),
                ('viewer','Viewer')
                # Thêm các role khác nếu cần
            ]),
        }