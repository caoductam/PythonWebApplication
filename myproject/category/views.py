from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

# Create your views here.
def index(request):
    return render(request, 'tag/index.html')