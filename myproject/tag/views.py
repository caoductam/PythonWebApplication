from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
# from .models import
# from .forms import 

# Create your views here.
@csrf_exempt
def api_tag(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM tag")
        columns = [col[0] for col in cursor.description]
        tags = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return JsonResponse(tags, safe=False)

def index(request):
    return render(request, 'tag/index.html')

def add_tag(request):
    if request.method == 'POST':
        name = request.POST.get('name')

        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO tag (name, created_at, updated_at)
                VALUES (%s, NOW(), NOW())
            """, [name])
        return redirect('tag:index')
    # Trường hợp GET hoặc các method khác
    return render(request, 'tag/add_tag.html')

# def update_user(request):
#     return render(request, 'user/update_user.html')

def update_tag(request, id):
    from django.db import connection
    if request.method == 'POST':
        name = request.POST.get('name')

        with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE tag SET 
                        name=%s, updated_at=NOW()
                    WHERE id=%s
                """, [name, id])
        return redirect('tag:index')
    else:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM tag WHERE id = %s", [id])
            row = cursor.fetchone()
            if not row:
                return HttpResponse("Không tìm thấy thẻ", status=404)
            columns = [col[0] for col in cursor.description]
            tag = dict(zip(columns, row))
        return render(request, 'tag/update_tag.html', {'tag': tag})
    
def delete_tag(request, id):
    if request.method == 'POST':
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM tag WHERE id = %s", [id])
            if cursor.fetchone()[0] == 0:
                return HttpResponse("Thẻ không tồn tại", status=404)
            cursor.execute("DELETE FROM tag WHERE id = %s", [id])
        return redirect('tag:index')
    else:
        return HttpResponse("Phương thức không hợp lệ", status=405)