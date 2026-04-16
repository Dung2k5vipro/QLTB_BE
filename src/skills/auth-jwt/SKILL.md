# SKILL: auth-jwt

Muc tieu: Xac thuc va phan quyen bang JWT don gian, de mo rong.

Quy tac:
- Dang nhap thanh cong thi cap `access token` ky bang `JWT_SECRET`.
- Middleware `auth` doc token tu header `Authorization: Bearer <token>`.
- Token khong hop le hoac het han thi tra 401.
- Middleware `role` kiem tra vai tro nguoi dung theo route can bao ve.
- Khong hard-code secret trong code, doc tu `.env`.
