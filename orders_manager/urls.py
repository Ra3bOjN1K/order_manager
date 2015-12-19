# -*- coding: utf-8 -*-

from django.conf.urls import url
from django.views.generic import RedirectView

from orders_manager import views


urlpatterns = [
    url(r'^robots.txt$', views.robots),
    url(r'^$', RedirectView.as_view(
        pattern_name='orders_manager:orders_list', permanent=True)),
    # url(r'^login/$', views.LoginFormView.as_view(), name='login'),
    url(r'^logout/$', views.LogoutFormView.as_view(), name='logout'),
    url(r'^database/populate/$', views.PopulateDatabaseView.as_view()),

    url(r'^login/', views.GoogleOauthView.as_view()),
    url(r'^login/auth_code/', views.GoogleOauthView.as_view()),

    url(r'^celery/test/', views.CeleryTestManipulationsView.as_view()),

    url(r'^api/v1/permissions/$', views.UserPermissionList.as_view()),
    url(r'^api/v1/users/$', views.UserListView.as_view(), name='profiles_list'),
    url(r'^api/v1/users/password/$', views.UserChangePasswordView.as_view()),

    url(r'^api/v1/clients/$', views.ClientListView.as_view()),
    url(r'^api/v1/clients/(?P<pk>[\d]+)/$', views.ClientView.as_view()),
    url(r'^api/v1/clients/(?P<pk>[\d]+)/children/$', views.ClientChildrenListView.as_view()),

    url(r'^api/v1/orders/$', views.OrderListView.as_view()),
    url(r'^api/v1/orders/(?P<pk>[\d]+)/$', views.OrderView.as_view()),
    url(r'^api/v1/orders/executor_comment/$',
        views.OrderExecutorCommentView.as_view()),

    url(r'^api/v1/programs/$', views.ProgramListView.as_view()),
    url(r'^api/v1/programs/(?P<pk>[\d]+)/$', views.ProgramView.as_view()),
    url(r'^api/v1/programs/(?P<pk>[\d]+)/prices/$',
        views.ProgramPriceListView.as_view()),

    url(r'^api/v1/additional_services/$',
        views.AdditionalServicesListView.as_view()),

    url(r'^api/v1/discounts/$',
        views.DiscountListView.as_view()),

    url(r'^api/v1/days_off/$', views.DayOffListView.as_view()),
    url(r'^api/v1/days_off/(?P<pk>[\d]+)/$', views.DayOffView.as_view()),

    url(r'^orders/$', views.ShowAllOrdersListView.as_view(),
        name='orders_list'),
]

