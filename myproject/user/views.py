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
def api_user(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM user")
        columns = [col[0] for col in cursor.description]
        users = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return JsonResponse(users, safe=False)

def index(request):
    return render(request, 'user/index.html')

def add_user(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        full_name = request.POST.get('full_name')
        email = request.POST.get('email')
        role = request.POST.get('role')
        is_active = 1 if request.POST.get('active') == 'yes' else 0

        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO user (username, password, full_name, email, role, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, [username, password, full_name, email, role, is_active])
        return redirect('user:index')
    # Trường hợp GET hoặc các method khác
    return render(request, 'user/add_user.html')

# def update_user(request):
#     return render(request, 'user/update_user.html')

def update_user(request, id):
    from django.db import connection
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        full_name = request.POST.get('full_name')
        email = request.POST.get('email')
        role = request.POST.get('role')
        is_active = 1 if request.POST.get('active') == 'yes' else 0

        with connection.cursor() as cursor:
            # Nếu có nhập mật khẩu mới thì update luôn, không thì giữ nguyên
            if password and password.strip() != '':
                cursor.execute("""
                    UPDATE user SET 
                        username=%s, password=%s, full_name=%s, email=%s, role=%s, is_active=%s, updated_at=NOW()
                    WHERE id=%s
                """, [username, password, full_name, email, role, is_active, id])
            else:
                cursor.execute("""
                    UPDATE user SET 
                        username=%s, full_name=%s, email=%s, role=%s, is_active=%s, updated_at=NOW()
                    WHERE id=%s
                """, [username, full_name, email, role, is_active, id])
        return redirect('user:index')
    else:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM user WHERE id = %s", [id])
            row = cursor.fetchone()
            if not row:
                return HttpResponse("Không tìm thấy người dùng", status=404)
            columns = [col[0] for col in cursor.description]
            user = dict(zip(columns, row))
        return render(request, 'user/update_user.html', {'user': user})