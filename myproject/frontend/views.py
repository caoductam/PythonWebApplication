from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, 'frontend/index.html')

def login_view(request):
    return render(request, 'frontend/login.html')

def viewer_home(request):
    return render(request, 'frontend/viewer_home.html')

def editor_home(request):
    return render(request, 'frontend/editor_home.html')

def admin_home(request):
    return render(request, 'frontend/admin_home.html')