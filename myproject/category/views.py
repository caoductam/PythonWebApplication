from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from .models import Category

# Create your views here.
def index(request):
    return render(request, 'category/index.html')

@csrf_exempt
def api_category(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM category")
        columns = [col[0] for col in cursor.description]
        categories = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return JsonResponse(categories, safe=False)

def add_category(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        parent_id = request.POST.get('parent_id')

        # Điều chỉnh ở đây: nếu parent_id là '', chuyển thành None
        if not parent_id:
            parent_id = None

        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO category (name, description, created_at, updated_at, parent_id)
                VALUES (%s, %s, NOW(), NOW(), %s)
            """, [name, description, parent_id])
        return redirect('category:index')
    # Trường hợp GET hoặc các method khác
    return render(request, 'category/add_category.html')

def update_category(request, id):
    from django.db import connection
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        parent_id = request.POST.get('parent_id')
        if not parent_id:
            parent_id = None

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE category SET 
                    name=%s, description=%s, updated_at=NOW(), parent_id=%s
                WHERE id=%s
            """, [name, description, parent_id, id])
        return redirect('category:index')
    else:
        with connection.cursor() as cursor:
            # Lấy category đang sửa
            cursor.execute("SELECT * FROM category WHERE id = %s", [id])
            row = cursor.fetchone()
            if not row:
                return HttpResponse("Không tìm thấy danh mục", status=404)
            columns = [col[0] for col in cursor.description]
            category = dict(zip(columns, row))

            # Lấy tất cả category khác (trừ chính nó)
            cursor.execute("SELECT * FROM category WHERE id != %s", [id])
            categories = [dict(zip([col[0] for col in cursor.description], r)) for r in cursor.fetchall()]

        return render(request, 'category/update_category.html', {
            'category': category,
            'categories': categories
        })
        
@csrf_exempt
def delete_category(request, id):
    if request.method == 'DELETE':
        try:
            category = Category.objects.get(id=id)
            # Set parent = None cho các con trước
            Category.objects.filter(parent=category).update(parent=None)
            category.delete()
            return JsonResponse({'success': True})
        except Category.DoesNotExist:
            return JsonResponse({'error': 'Category not found'}, status=404)
    return JsonResponse({'error': 'Invalid method'}, status=405)
    