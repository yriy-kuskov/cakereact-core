import React, { useEffect, useMemo } from 'react';
import { useController } from '../../../index';
import {
    AdminPage,
    AdminHeader,
    AdminFormSection,
    AdminTableSection,
    CakeForm
} from '../../index';

export const AdminResourcePage = ({
    modelClass,    // Класс модели (например, CategoryModel)
    title,         // Заголовок страницы
    subtitle,      // Подзаголовок
    icon,          // Иконка
    formTitle,     // Заголовок формы
    tableTitle,    // Заголовок таблицы
    columns,       // Конфигурация колонок
    children,      // Поля формы (CakeInput и т.д.)
    order = ['name', 'asc'] // Сортировка по умолчанию
}) => {
    // 1. Инициализация (то, что мы дублировали)
    const model = useMemo(() => new modelClass(), [modelClass]);
    const controller = useController(model);
    const { getList, setRecord } = controller;

    useEffect(() => {
        getList({ order });
    }, [getList]);

    const handleEdit = (item) => {
        setRecord(item);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AdminPage>
            <AdminHeader title={title} subtitle={subtitle} icon={icon} />

            <CakeForm controller={controller}>
                <AdminFormSection controller={controller} title={formTitle}>
                    {children}
                </AdminFormSection>
            </CakeForm>

            <AdminTableSection
                controller={controller}
                title={tableTitle}
                columns={columns}
                onEdit={handleEdit}
            />
        </AdminPage>
    );
};