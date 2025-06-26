'use client';

import React from 'react';
import { usePermissionContext } from '@/context/permission-context';
import { isOwner } from '@/app/settings/lib/env-config';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireOwner?: boolean;
}

/**
 * 權限控制組件
 * 基於用戶權限控制子組件的渲染
 */
export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null,
  requireOwner = false 
}: PermissionGuardProps) {
  const { hasPermission, userProfile } = usePermissionContext();
  
  // 檢查是否為擁有者
  const isUserOwner = userProfile?.uid ? isOwner(userProfile.uid) : false;
  
  // 如果需要擁有者權限
  if (requireOwner && !isUserOwner) {
    return <>{fallback}</>;
  }
  
  // 檢查一般權限
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * 角色控制組件
 * 基於用戶角色控制子組件的渲染
 */
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = null 
}: RoleGuardProps) {
  const { userRole } = usePermissionContext();
  
  if (!userRole || !allowedRoles.includes(userRole.id)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * 資料範圍控制組件
 * 基於用戶資料範圍控制子組件的渲染
 */
interface DataScopeGuardProps {
  scope: 'all' | 'department' | 'own' | 'none';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userUid?: string;
  dataOwnerUid?: string;
  userDepartment?: string;
  dataDepartment?: string;
}

export function DataScopeGuard({
  scope,
  children,
  fallback = null,
  userUid,
  dataOwnerUid,
  userDepartment,
  dataDepartment,
}: DataScopeGuardProps) {
  const { userProfile } = usePermissionContext();
  
  // 擁有者可以查看所有資料
  if (userProfile?.uid && isOwner(userProfile.uid)) {
    return <>{children}</>;
  }
  
  // 根據範圍檢查權限
  switch (scope) {
    case 'all':
      return <>{children}</>;
      
    case 'department':
      if (userDepartment && dataDepartment && userDepartment === dataDepartment) {
        return <>{children}</>;
      }
      break;
      
    case 'own':
      if (userUid && dataOwnerUid && userUid === dataOwnerUid) {
        return <>{children}</>;
      }
      break;
      
    case 'none':
      break;
  }
  
  return <>{fallback}</>;
}

/**
 * 專案權限守衛組件
 * 基於專案權限控制子組件的渲染
 */
interface ProjectPermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireOwner?: boolean;
}

export function ProjectPermissionGuard({ 
  permission, 
  children, 
  fallback = null,
  requireOwner = false 
}: ProjectPermissionGuardProps) {
  const { hasPermission, userProfile } = usePermissionContext();
  
  // 檢查是否為擁有者
  const isUserOwner = userProfile?.uid ? isOwner(userProfile.uid) : false;
  
  // 如果需要擁有者權限
  if (requireOwner && !isUserOwner) {
    return <>{fallback}</>;
  }
  
  // 檢查專案權限
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * 專案操作權限檢查組件
 * 用於檢查專案相關操作的權限
 */
interface ProjectActionGuardProps {
  action: 'create' | 'read' | 'write' | 'delete' | 'assign';
  resource: 'project' | 'package' | 'subpackage' | 'task' | 'member' | 'settings';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireOwner?: boolean;
}

export function ProjectActionGuard({
  action,
  resource,
  children,
  fallback = null,
  requireOwner = false
}: ProjectActionGuardProps) {
  const { hasPermission, userProfile } = usePermissionContext();
  
  // 檢查是否為擁有者
  const isUserOwner = userProfile?.uid ? isOwner(userProfile.uid) : false;
  
  // 如果需要擁有者權限
  if (requireOwner && !isUserOwner) {
    return <>{fallback}</>;
  }
  
  // 構建權限 ID
  const permissionId = `project:${resource}:${action}`;
  
  // 檢查權限
  if (!hasPermission(permissionId)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
} 