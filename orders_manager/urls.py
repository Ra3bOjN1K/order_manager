# -*- coding: utf-8 -*-

from django.conf.urls import url
from django.views.generic import RedirectView

from orders_manager import views

urlpatterns = [
    url(r'^$', RedirectView.as_view(
        pattern_name='orders_manager:orders_list', permanent=True)),
    url(r'^login/$', views.LoginFormView.as_view(), name='login'),
    url(r'^logout/$', views.LogoutFormView.as_view(), name='logout'),
    url(r'^change_pwd/$', views.ChangePasswordFormView.as_view(),
        name='change_password'),
    url(r'^profile/$', views.ShowMyProfileFormView.as_view(),
        name='my_profile'),
    url(r'^orders/$', views.ShowAllOrdersListView.as_view(),
        name='orders_list'),
    url(r'^customers/$', views.ShowAllOrdersListView.as_view(),
        name='customers_list'),
    url(r'^handbooks/$', views.ShowHandbooksView.as_view(),
        name='handbooks_list'),
    url(r'^users/$', views.UsersListView.as_view(), name='profiles_list'),
    url(r'^user/(?P<username>[\w\.]+)/show/$',
        views.ShowUserProfileFormView.as_view(), name='user_profile'),
    url(r'^user/(?P<username>[\w\.]+)/edit/$', views.EditUserFormView.as_view(),
        name='edit_user'),
    url(r'^user/(?P<username>[\w\.]+)/delete/$', views.DeleteUserView.as_view(),
        name='delete_user'),
    url(r'^users/create/manager/$', views.CreateUserFormView.as_view(),
        name='create_manager'),
    url(r'^users/create/animator/$', views.CreateUserFormView.as_view(),
        name='create_animator'),
    url(r'^users/create/photographer/$', views.CreateUserFormView.as_view(),
        name='create_photographer'),
]
