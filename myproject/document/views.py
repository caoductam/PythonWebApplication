from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.conf import settings
import json
from .models import Document
from category.models import Category
from user.models import User
import os

def index(request):
    return render(request, 'document/index.html')

def add_document(request):
    return render(request, 'document/add_document.html')

@csrf_exempt
def api_category(request):
    categories = Category.objects.all().values('id', 'name')
    return JsonResponse(list(categories), safe=False)

@csrf_exempt
def api_user(request):
    users = User.objects.all().values('id', 'username', 'role')
    return JsonResponse(list(users), safe=False)

@csrf_exempt
def upload_file(request):
    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        file_name = default_storage.save('documents/' + file.name, file)
        file_url = settings.MEDIA_URL + file_name
        return JsonResponse({
            'file_url': file_url,
            'file_name': file.name,
            'file_type': file.content_type,
            'file_size': file.size
        })
    return JsonResponse({'error': 'No file uploaded'}, status=400)

@csrf_exempt
def add_document_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            title = data.get('title')
            description = data.get('description')
            file_path = data.get('file_path')
            file_name = data.get('file_name')
            file_type = data.get('file_type')
            file_size = data.get('file_size')
            category_id = data.get('category_id')
            created_by_id = data.get('created_by')

            category = Category.objects.get(id=category_id)
            created_by = User.objects.get(id=created_by_id)
            doc = Document.objects.create(
                title=title,
                description=description,
                file_path=file_path,
                file_name=file_name,
                file_type=file_type,
                file_size=file_size,
                category_id=category,
                created_by=created_by
            )
            return JsonResponse({'success': True, 'document_id': doc.id, 'redirect_url': '/document/'})
        except Category.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Category not found'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'error': 'Invalid request'}, status=400)

def update_document(request, id):
    document = get_object_or_404(Document, id=id)
    categories = Category.objects.all()
    users = User.objects.all()
    if request.method == 'POST':
        document.title = request.POST.get('title')
        document.description = request.POST.get('description')
        document.category_id = request.POST.get('category_id')
        document.created_by_id = request.POST.get('created_by')
        file = request.FILES.get('file_upload')
        if file:
            file_name = file.name
            file_type = file.content_type
            file_size = file.size
            file_save_path = os.path.join('documents', file_name)
            full_path = os.path.join(settings.MEDIA_ROOT, file_save_path)
            with open(full_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            file_url = settings.MEDIA_URL + 'documents/' + file_name
            document.file_path = file_url
            document.file_name = file_name
            document.file_type = file_type
            document.file_size = file_size
        document.save()
        return redirect('document:index')
    return render(request, 'document/update_document.html', {
        'document': document,
        'categories': categories,
        'users': users
    })

def delete_document(request, id):
    if request.method == 'POST' or request.method == 'DELETE':
        document = get_object_or_404(Document, id=id)
        document.delete()
        if request.is_ajax() or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
        return redirect('document:index')
    # Nếu là GET, trả về lỗi rõ ràng
    return JsonResponse({'error': 'Invalid request'}, status=400)

def api_document_list(request):
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    search = request.GET.get('search', '').strip()

    documents = Document.objects.select_related('category_id', 'created_by').all()
    if search:
        documents = documents.filter(title__icontains=search)
    total = documents.count()
    start = (page - 1) * page_size
    end = start + page_size
    documents = documents[start:end]

    data = [
        {
            'id': doc.id,
            'title': doc.title,
            'description': doc.description,
            'file_path': doc.file_path,
            'file_name': doc.file_name,
            'file_type': doc.file_type,
            'file_size': doc.file_size,
            'category': {
                'id': doc.category_id.id,
                'name': doc.category_id.name
            } if doc.category_id else None,
            'category_name': doc.category_id.name if doc.category_id else '',
            'created_by': {
                'id': doc.created_by.id,
                'username': doc.created_by.username
            } if doc.created_by else None,
            'created_by_username': doc.created_by.username if doc.created_by else '',
            # 'created_at': doc.created_at.strftime('%Y-%m-%d %H:%M'),
            # 'updated_at': doc.updated_at.strftime('%Y-%m-%d %H:%M'),
        }
        for doc in documents
    ]

    return JsonResponse({
        'results': data,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    })