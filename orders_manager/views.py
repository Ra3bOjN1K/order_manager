from collections import OrderedDict

from django.template import loader, RequestContext
from django.core.urlresolvers import reverse
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, Http404, JsonResponse
from django.views.generic import ListView, View, TemplateView
from django.views.generic.edit import FormView
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.forms.formsets import formset_factory

from orders_manager.forms import UserPasswordChangeForm, \
    UpdateUserProfileForm, ShowUserProfileForm, CreateUserProfileForm, \
    ProgramModelForm, ProgramPriceForm, OrderModelForm, ClientModelForm
from orders_manager.models import UserProfile, Program, ProgramPrice, Client, \
    ClientChild

from rolepermissions.mixins import HasPermissionsMixin


class LoginFormView(FormView):
    form_class = AuthenticationForm
    template_name = 'orders_manager/authorization/login.html'
    success_url = '/'

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated():
            raise Http404()
        return super(LoginFormView, self).get(request, *args, **kwargs)

    def form_valid(self, form):
        self.user = form.get_user()
        login(self.request, self.user)
        return super(LoginFormView, self).form_valid(form)


class ChangePasswordFormView(FormView):
    form_class = UserPasswordChangeForm
    template_name = 'orders_manager/authorization/change_password.html'
    success_url = '/login/'

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated():
            raise Http404()
        return super(ChangePasswordFormView, self).get(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super(ChangePasswordFormView, self).get_form_kwargs()
        kwargs.update({
            'user': self.request.user
        })
        return kwargs

    def form_valid(self, form):
        form.save()
        return super(ChangePasswordFormView, self).form_valid(form)


class LogoutFormView(View):
    def get(self, request):
        if not request.user.is_authenticated():
            raise Http404()
        logout(request)
        return HttpResponseRedirect("/")


class UsersListView(HasPermissionsMixin, ListView):
    model = UserProfile
    template_name = 'orders_manager/list_user.html'
    required_permission = 'see_all_profiles'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(UsersListView, self).dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        # from orders_manager.utils.generate_data_helper import populate_database
        # populate_database()

        context = super(UsersListView, self).get_context_data(**kwargs)
        context['managers'] = UserProfile.objects.all_managers()
        context['animators'] = UserProfile.objects.all_animators()
        context['photographers'] = UserProfile.objects.all_photographers()
        return context


class CreateUserFormView(HasPermissionsMixin, FormView):
    form_class = CreateUserProfileForm
    template_name = 'orders_manager/create_user_profile.html'
    required_permission = 'add_user'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(CreateUserFormView, self).dispatch(request, *args,
                                                        **kwargs)

    def get_form_kwargs(self):
        kwargs = super(CreateUserFormView, self).get_form_kwargs()
        user_role = list(filter(None, self.request.path.split('/')))[-1]
        kwargs['user_role'] = user_role
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')

    def form_valid(self, form):
        form.save()
        return super(CreateUserFormView, self).form_valid(form)


class ShowUserProfileFormView(HasPermissionsMixin, FormView):
    form_class = ShowUserProfileForm
    template_name = 'orders_manager/show_user_profile.html'
    required_permission = 'see_profile_details'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowUserProfileFormView, self).dispatch(request, *args,
                                                             **kwargs)

    def get_form_kwargs(self):
        kwargs = super(ShowUserProfileFormView, self).get_form_kwargs()
        if self.kwargs.get('username'):
            kwargs['user'] = UserProfile.objects.get(
                user__username=self.kwargs.get('username'))
        else:
            raise Http404()
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')


class ShowMyProfileFormView(FormView):
    form_class = ShowUserProfileForm
    template_name = 'orders_manager/show_user_profile.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        if self.request.user.is_superuser:
            raise Http404()
        return super(ShowMyProfileFormView, self).dispatch(request, *args,
                                                           **kwargs)

    def get_form_kwargs(self):
        kwargs = super(ShowMyProfileFormView, self).get_form_kwargs()
        kwargs['user'] = self.request.user.profile
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')


class EditUserFormView(HasPermissionsMixin, FormView):
    form_class = UpdateUserProfileForm
    template_name = 'orders_manager/edit_user_profile.html'
    required_permission = 'change_user'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(EditUserFormView, self).dispatch(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super(EditUserFormView, self).get_form_kwargs()
        if self.kwargs.get('username'):
            kwargs['user'] = UserProfile.objects.get(
                user__username=self.kwargs.get('username'))
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:profiles_list')

    def form_valid(self, form):
        form.save()
        return super(EditUserFormView, self).form_valid(form)


class DeleteUserView(HasPermissionsMixin, View):
    required_permission = 'delete_user'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(DeleteUserView, self).dispatch(request, *args, **kwargs)

    def get(self, request, **kwargs):
        username = kwargs.get('username')
        if username:
            profile = UserProfile.objects.get(user__username=username)
            profile.make_inactive()
            return HttpResponseRedirect(reverse("orders_manager:profiles_list"))
        else:
            raise AttributeError('Can\'t delete user. Username not found!')


class ShowProgramsHandbookView(HasPermissionsMixin, TemplateView):
    required_permission = 'see_handbooks'
    template_name = 'orders_manager/handbooks/list_program.html'

    def get_context_data(self, **kwargs):
        context = super(ShowProgramsHandbookView, self).get_context_data(
            **kwargs)
        context['programs_list'] = Program.objects.all()
        context['new_price_form'] = ProgramPriceForm()
        return context


class CreateProgramFormView(HasPermissionsMixin, FormView):
    required_permission = 'add_program'
    template_name = 'orders_manager/handbooks/create_program.html'
    form_class = ProgramModelForm

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(CreateProgramFormView, self).dispatch(request, *args,
                                                           **kwargs)

    def get_success_url(self):
        return reverse('orders_manager:programs_handbook')

    def form_valid(self, form):
        form.save()
        return super(CreateProgramFormView, self).form_valid(form)


class EditProgramFormView(HasPermissionsMixin, FormView):
    required_permission = 'edit_program'
    template_name = 'orders_manager/handbooks/create_program.html'
    form_class = ProgramModelForm

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(EditProgramFormView, self).dispatch(request, *args,
                                                         **kwargs)

    def get_form_kwargs(self):
        kwargs = super(EditProgramFormView, self).get_form_kwargs()
        if self.kwargs.get('id'):
            kwargs['program'] = Program.objects.get(id=self.kwargs.get('id'))
        else:
            raise AttributeError('Attribute \'id\' not found.')
        return kwargs

    def get_success_url(self):
        return reverse('orders_manager:programs_handbook')

    def form_valid(self, form):
        form.save()
        return super(EditProgramFormView, self).form_valid(form)


class DeleteProgramView(HasPermissionsMixin, View):
    required_permission = 'delete_program'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(DeleteProgramView, self).dispatch(request, *args, **kwargs)

    def get(self, request, **kwargs):
        prog_id = kwargs.get('id')
        if prog_id:
            program = Program.objects.get(id=prog_id)
            program.delete()
            return HttpResponseRedirect(
                reverse("orders_manager:programs_handbook")
            )
        else:
            raise AttributeError('Can\'t delete program. Id not found!')


class ShowProgramPricesView(HasPermissionsMixin, TemplateView):
    required_permission = 'see_program_prices'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowProgramPricesView, self).dispatch(
            request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        ProgramPriceFormset = formset_factory(form=ProgramPriceForm, extra=0)

        program_id = kwargs.get('program_id')
        prices = ProgramPrice.objects.filter(
            program__id=program_id).order_by("duration")
        initial_data = [{
                            'program_id': p.program.id,
                            'duration': p.duration,
                            'price': p.price
                        } for p in prices]
        formset = ProgramPriceFormset(initial=initial_data) if prices else None
        template_str = loader.render_to_string(
            'orders_manager/handbooks/list_program_price.html',
            {
                'price_formset': formset
            }
        )
        return JsonResponse({
            'html_page': template_str,
            'program_id': program_id,
        })


class CreateProgramPriceView(HasPermissionsMixin, View):
    required_permission = 'create_program_price'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(CreateProgramPriceView, self).dispatch(request, *args,
                                                            **kwargs)

    def post(self, request):
        form = ProgramPriceForm(request.POST)
        ProgramPriceFormset = formset_factory(form=ProgramPriceForm, extra=0)

        if form.is_valid():
            form.save()

        prices = ProgramPrice.objects.filter(
            program__id=request.POST['program_id']).order_by("duration")
        template_str = loader.render_to_string(
            'orders_manager/handbooks/list_program_price.html',
            {
                'price_formset':
                    ProgramPriceFormset(
                        initial=self._get_initial_prices(prices)) if prices
                    else None
            }
        )

        return JsonResponse({
            'program_id': request.POST['program_id'],
            'errors': form.errors,
            'html_page': template_str
        })

    def _get_initial_prices(self, prices):
        return [{'program_id': p.program.id, 'duration': p.duration,
                 'price': p.price} for p in prices]


class DeleteProgramPriceView(HasPermissionsMixin, View):
    required_permission = 'delete_program_price'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(DeleteProgramPriceView, self).dispatch(request, *args,
                                                            **kwargs)

    def post(self, request):
        from django.db.models import Q

        program_id = int(request.POST.get('program_id'))
        duration = float(request.POST.get('duration'))
        if program_id and duration:
            program_price = ProgramPrice.objects.filter(
                Q(program__id=program_id) & Q(duration=duration)).first()
            if program_price:
                program_price.delete()
                return JsonResponse({'result': True})
        return JsonResponse({'result': False})


class ShowAdditionalServicesHandbookView(HasPermissionsMixin, TemplateView):
    required_permission = 'see_additional_services'
    template_name = 'orders_manager/handbooks/list_additional_service.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowAdditionalServicesHandbookView, self).dispatch(
            request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(ShowAdditionalServicesHandbookView,
                        self).get_context_data(**kwargs)
        return context


class ShowExecutorsHandbookView(HasPermissionsMixin, TemplateView):
    required_permission = 'see_executors'
    template_name = 'orders_manager/handbooks/list_executor.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowExecutorsHandbookView, self).dispatch(request, *args,
                                                               **kwargs)

    def get_context_data(self, **kwargs):
        context = super(ShowExecutorsHandbookView, self).get_context_data(
            **kwargs)
        return context


class ShowDiscountsHandbookView(HasPermissionsMixin, TemplateView):
    required_permission = 'see_discounts'
    template_name = 'orders_manager/handbooks/list_discount.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowDiscountsHandbookView, self).dispatch(request, *args,
                                                               **kwargs)

    def get_context_data(self, **kwargs):
        context = super(ShowDiscountsHandbookView, self).get_context_data(
            **kwargs)
        return context


class ShowClientsView(HasPermissionsMixin, TemplateView):
    required_permission = 'see_customers'
    template_name = 'orders_manager/list_customer.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowClientsView, self).dispatch(request, *args,
                                                     **kwargs)

    def get_context_data(self, **kwargs):
        context = super(ShowClientsView, self).get_context_data(
            **kwargs)
        return context


class SearchClientsView(HasPermissionsMixin, View):
    required_permission = 'see_customers'

    def get(self, request, **kwargs):
        key = request.GET.get('q')
        clients = []
        if key:
            clients_qs = Client.objects.search(key=key)
            for client in clients_qs:
                clients.append({
                    'id': client.id,
                    'name': client.name,
                    'phone': client.phone
                })

        return JsonResponse({'clients': clients})


class ShowAllOrdersListView(HasPermissionsMixin, TemplateView):
    required_permission = 'see_all_orders'
    template_name = 'orders_manager/list_order.html'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(ShowAllOrdersListView, self).dispatch(request, *args,
                                                           **kwargs)

    def get_context_data(self, **kwargs):
        context = super(ShowAllOrdersListView, self).get_context_data(**kwargs)
        return context


class ClientChildrenView(HasPermissionsMixin, View):
    required_permission = 'see_customer_children'

    def get(self, request, **kwargs):
        order_form = OrderModelForm()
        children_field = order_form.fields['client_children']

        if kwargs.get('id'):
            client = Client.objects.get(id=kwargs.get('id'))
            children_field.queryset = client.children.all()
        response = children_field.widget.render('client_children', [])

        return JsonResponse({'children_html': response})


class ProgramInfoView(HasPermissionsMixin, View):
    required_permission = 'see_program_info'

    def get(self, request, **kwargs):
        program_info = {}

        if kwargs.get('id'):
            prog = Program.objects.get(id=kwargs.get('id'))

            program_form = ProgramModelForm()
            executors_field = program_form.fields['possible_program_executors']
            executors_field.queryset = prog.possible_executors.order_by(
                'user__groups__name', 'user__last_name').all()
            executors = executors_field.widget.render(
                'possible_program_executors', [])

            program_info.update({
                'executors_html': executors,
                'prices': OrderedDict(
                    [(p.duration, p.price) for p in prog.get_all_prices()]
                )
            })

        return JsonResponse(program_info)


class CreateOrderView(HasPermissionsMixin, View):
    required_permission = 'add_order'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(CreateOrderView, self).dispatch(request, *args,
                                                     **kwargs)

    def get(self, request, *args, **kwargs):
        start_date = request.GET['start_date']
        template_str = loader.render_to_string(
            'orders_manager/create_order.html',
            {
                'order_form': OrderModelForm(celebrate_date=start_date),
                'client_form': ClientModelForm()
            },
            context_instance=RequestContext(request)
        )

        return JsonResponse({
            'html': template_str
        })


class SimpleCreateClientView(HasPermissionsMixin, View):
    required_permission = 'add_customers'

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(SimpleCreateClientView, self).dispatch(request, *args,
                                                            **kwargs)

    def post(self, request, *args, **kwargs):
        child_name = request.POST.get('child_name')
        child_age = request.POST.get('child_age')
        celebrate_date = request.POST.get('celebrate_date')
        client = Client.objects.update_or_create(
            name=request.POST.get('client_name'),
            phone=request.POST.get('phone'),
        )
        child = ClientChild.objects.update_or_create(**{
            'name': child_name,
            'age': child_age,
            'celebrate_date': celebrate_date,
            'client_id': client.id
        })
        client.children.add(child)

        return JsonResponse({
            'result': 'success'
        })
