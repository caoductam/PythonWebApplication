from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.views import View
# from .models import
# from .forms import 

# Create your views here.
def index(request):
    return render(request, 'user/index.html')
