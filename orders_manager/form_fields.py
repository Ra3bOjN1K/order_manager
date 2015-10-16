# -*- coding: utf-8 -*-

from django import forms
from django.utils.safestring import mark_safe


class CheckboxToButtonSelectMultiple(forms.CheckboxSelectMultiple):
    def render(self, name, value, attrs=None, choices=()):
        value = value or []
        out_body = ''
        disabled = 'disabled' if self.attrs.get('readonly') else ''
        for i_code, i_name in self.choices:
            checked = 'checked' if i_code in value else ''
            out_body += \
                '<div id="{0}-btn">' \
                '<label>' \
                '<input type="checkbox" value="{0}" name="{2}" {ch} {d}>' \
                '<span>{1}</span>' \
                '</label>' \
                '</div>'.format(i_code, i_name, name, ch=checked, d=disabled)
        output = "<div class='multiple-btns-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=out_body)
        return mark_safe(output)


class RadioButtonToButtonSelect(forms.RadioSelect):
    def render(self, name, value, attrs=None, choices=()):
        value = value or []
        out_body = ''
        disabled = 'disabled' if self.attrs.get('readonly') else ''
        for i_code, i_name in self.choices:
            checked = 'checked="checked"' if i_code in value else ''
            out_body += \
                '<div id="{0}-btn">' \
                '<label>' \
                '<input type="radio" value="{0}" name="{2}" {checked} {d}>' \
                '<span>{1}</span>' \
                '</label>' \
                '</div>'.format(i_code, i_name, name, checked=checked,
                                d=disabled)
        output = "<div class='radio-btns-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=out_body)
        return mark_safe(output)


class ExecutorsMultipleChoiceField(forms.CheckboxSelectMultiple):
    def render(self, name, value, attrs=None, choices=()):
        value = [int(i) for i in value] if value else []
        out_body = ''
        for i_code, i_name in self.choices:
            checked = 'checked' if i_code in value else ''
            profile = self.choices.queryset.get(user__username=i_name)
            out_body += \
                '<div id="{0}-btn">' \
                '<label>' \
                '<input type="checkbox" value="{0}" name="{1}" {ch}>' \
                '<div class="profile-line">' \
                '<span class="profile-line__role">{profile_role}</span>' \
                '<span class="profile-line__name">{profile_full_name}</span>' \
                '</div>' \
                '</label>' \
                '</div>'.format(i_code, name, ch=checked,
                                profile_role=profile.get_role_name(),
                                profile_full_name=profile.get_full_name())
        output = "<div class='executors-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=out_body)
        return mark_safe(output)


class ServicesMultipleChoiceField(forms.CheckboxSelectMultiple):
    def render(self, name, value, attrs=None, choices=()):
        value = [int(i) for i in value] if value else []
        out_body = ''
        for i_code, i_name in self.choices:
            checked = 'checked' if i_code in value else ''
            service = self.choices.queryset.get(title=i_name)
            out_body += \
                '<div id="{0}-btn">' \
                '<label>' \
                '<input type="checkbox" value="{0}" name="{1}" {ch}>' \
                '<div class="service-line">' \
                '<span class="service-line__name">{service_name}</span>' \
                '<span class="service-line__price">{service_price}</span>' \
                '</div>' \
                '</label>' \
                '</div>'.format(i_code, name, ch=checked,
                                service_name=service.title,
                                service_price=service.price)
        output = "<div class='services-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=out_body)
        return mark_safe(output)


class ClientChildrenMultipleChoiceField(forms.CheckboxSelectMultiple):
    def render(self, name, value, attrs=None, choices=()):
        value = [int(i) for i in value] if value else []
        out_body = ''
        for i_code, i_name in self.choices:
            checked = 'checked' if i_code in value else ''
            child = self.choices.queryset.get(id=i_code)
            out_body += \
                '<div id="{0}-child-btn">' \
                '<label>' \
                '<input type="checkbox" value="{0}" name="{1}" {ch}>' \
                '<div class="child-line">' \
                '<span class="child-line__name">{child_name}</span>' \
                '<span class="child-line__age">({child_age} {age_lbl})</span>' \
                '</div>' \
                '</label>' \
                '</div>'.format(i_code, name, ch=checked,
                                child_name=child.name,
                                child_age=child.age(),
                                age_lbl=self._check_age_lbl(child.age()))
        output = "<div class='children-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=out_body)
        return mark_safe(output)

    def _check_age_lbl(self, age):
        if age > 0 and age // 10 != 1:
            if age % 10 == 1:
                return 'год'
            elif age % 10 in (2, 3, 4):
                return 'года'
            else:
                return 'лет'
        else:
            return 'лет'


class AddressMultiTextInput(forms.TextInput):
    def render(self, name, value, attrs=None):
        from orders_manager.models import AddressParser

        address_parser = AddressParser()
        address = address_parser.parse_string(value)
        body = ''
        fields = (
            ('city', 'Город:'),
            ('street', 'Улица:'),
            ('house', 'Дом:'),
            ('housing', 'Корпус:'),
            ('apartment', 'Квартира:')
        )
        html_input = \
            "<div class='{0}-field'>" \
            "<label for='{0}'>{2}</label>" \
            "<input id='id_{0}' name='{0}' type='text' value='{1}' class='{0}'>" \
            "</div>"
        for item, label in fields:
            if hasattr(address, item):
                if item == 'house':
                    body += "<div>"
                body += html_input.format(item, getattr(address, item), label)

        body += "</div>"
        body += \
            "<label for='{0}'>Дополнительно:</label>" \
            "<textarea id='id_{0}' name='{0}' value='{1}'></textarea>".format(
                'description', getattr(address, 'description'))
        output = "<div class='address-info-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=body)

        return mark_safe(output)
