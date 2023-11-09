import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant } from '../../apiTypes';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { getTenantsAsync } from '../../reducers/TenantSlice';
import { LoadState } from '../../types';
import './Home.css';

export default function Home() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const tenantState = useAppSelector(s => s.tenantState);

    useEffect(() => {
        if (tenantState.loadState === LoadState.INIT) {
            dispatch(getTenantsAsync());
        }
    }, []);
    
    const onCreateTenantClick = () => {
        navigate('/tenant/create');
    }

    const onTenantClick = (tenantId: string) => {
        navigate(`/tenant/${tenantId}`);
    }

    const renderTenant = (tenant: Tenant) => {
        return(
            <div className='tenant-card' key={tenant.tenant_id} onClick={() => onTenantClick(tenant.tenant_id)}>
                {tenant.tenant_name}
            </div>
        )
    }

    return(
        <div className='home-container'>
            <div className='tenants'>
                <h3>Tenants</h3>
                <div className='tenant-card' onClick={onCreateTenantClick}>
                    Create new tenant
                </div>
                {tenantState.tenants.map(tenant => renderTenant(tenant))}
            </div>
        </div>
    )
}