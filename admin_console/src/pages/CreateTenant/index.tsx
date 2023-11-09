import { ErrorMessage, Field, Form, Formik } from 'formik';
import React, { ChangeEvent, useState } from 'react';
import { CreateTenantRequest } from '../../apiTypes';
import { useAppDispatch } from '../../hooks';
import { registerTenantAsync } from '../../reducers/TenantSlice';

import './CreateTenant.css';

export default function CreateTenant() {
    const dispatch = useAppDispatch();
    const empty_request: CreateTenantRequest = {
        tenantAdminEmail: '',
        tenantAdminFirstName: '',
        tenantAdminLastName: '',
        tenant_name: '',
        tenantTier: 'Standard',
        userPoolId: '',
    }
    // const [data, setData] = useState<CreateTenantRequest>(empty_request);

    // const onNameChange = (e: ChangeEvent<HTMLInputElement>) => setData({...data, tenantName: e.currentTarget.value});
    // const onFirstNameChange = (e: ChangeEvent<HTMLInputElement>) => setData({...data, tenantAdminFirstName: e.currentTarget.value});
    // const onLastNameChange = (e: ChangeEvent<HTMLInputElement>) => setData({...data, tenantAdminLastName: e.currentTarget.value});
    // const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => setData({...data, tenantAdminEmail: e.currentTarget.value});
    const onSubmit = (values: CreateTenantRequest) => {
        dispatch(registerTenantAsync(values));
    }
    return(
        <div>
            <Formik
                initialValues={empty_request}
                onSubmit={onSubmit}
            >
                <Form className='create-tenant-form'>
                    <label htmlFor="tenantAdminEmail">Email</label>
                    <Field type="email" name="tenantAdminEmail" />
                    <ErrorMessage name="email" component="div" />
                    <label htmlFor="tenantAdminFirstName">Admin First Name</label>
                    <Field type="text" name="tenantAdminFirstName" />
                    <ErrorMessage name="tenantAdminFirstName" component="div" />
                    <label htmlFor="tenantAdminLastName">Admin Last Name</label>
                    <Field type="text" name="tenantAdminLastName" />
                    <ErrorMessage name="tenantAdminLastName" component="div" />
                    <label htmlFor="tenantName">Tenant Name</label>
                    <Field type="text" name="tenant_name" />
                    <ErrorMessage name="tenant_name" component="div" />
                    <button type="submit" disabled={false}>
                        Submit
                    </button>
                </Form>
            </Formik>
        </div>
    )
}