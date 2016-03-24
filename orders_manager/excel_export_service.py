# -*- coding: utf-8 -*-
from collections import OrderedDict

import io
import xlsxwriter


class OrderExcelExporter:
    _current_row = 0
    fields = (
        ('{order.celebrate_date}', 'Дата праздника'),
        ('{order.program.title}', 'Программа'),
        ('{order.price}', 'Стоимость программы'),
        ('{order.discount.value}', 'Скидка'),
        ('{order.total_price_with_discounts}', 'Стоимость заказа'),
        ('{order.client.name}', 'Клиент'),
        ('{order.client.phone}', 'Телефон клиента'),
        ('client_child_name', 'Имя ребенка'),
        ('client_child_birthday', 'Дата рождения ребенка'),
        ('{order.children_num}', 'Детей на празднике'),
        ('{order.celebrate_place}', 'Место проведения'),
        ('{order.where_was_found}', 'Откуда узнали о нас')
    )

    def _write_title(self, worksheet):
        column = 0
        for i in self.fields:
            worksheet.write(self._current_row, column, i[1])
            column += 1
        self._current_row += 1

    def _write_all_orders(self, orders, worksheet):
        for order in orders:
            self._write_order(order, worksheet)

    def _write_order(self, order, worksheet):
        column = 0
        for i in self.fields:
            value = ''
            if i[0] == 'client_child_name':
                child = order.client_children.first()
                if child:
                    value = child.name
            elif i[0] == 'client_child_birthday':
                child = order.client_children.first()
                if child:
                    value = child.birthday.strftime("%d.%m.%Y")
            else:
                value = i[0].format(order=order)
            worksheet.write(self._current_row, column, value)
            column += 1
        self._current_row += 1

    def build_orders_excel_output(self, orders):
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet('Список заказов Tilibom')
        self._write_title(worksheet)
        self._write_all_orders(orders, worksheet)
        workbook.close()
        output.seek(0)
        return output
