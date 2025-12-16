import React from 'react';
import {NavLink} from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    CreditCard,
    FileText,
    FolderKanban,
    Lock,
    SlidersHorizontal,
    Users
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useOrgBilling} from '../hooks/useOrgBilling';
import {useLang} from '../hooks/useLang';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
                                             isOpen,
                                             onClose,
                                             isCollapsed,
                                             onToggleCollapse,
                                         }) => {
    const {t} = useTranslation();
    const lang = useLang();
    const {billing} = useOrgBilling();
    const canUseProjects = !!billing?.tier?.can_use_projects;
    const mainNavItems = [
        {path: `/${lang}/app/documents`, label: t('sidebar.documents'), icon: FileText},
        {path: `/${lang}/app/projects`, label: t('sidebar.projects'), icon: FolderKanban, locked: !canUseProjects},
    ];

    const settingsNavItems = [
        {path: `/${lang}/app/settings/report`, label: t('sidebar.reportSettings'), icon: SlidersHorizontal},
        {path: `/${lang}/app/settings/organization`, label: t('sidebar.organization'), icon: Users},
        {path: `/${lang}/app/settings/billing`, label: t('sidebar.billingUsage'), icon: CreditCard},
    ];

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          ${isCollapsed ? 'w-16' : 'w-60'}
          bg-white border-r border-gray-200 h-[calc(100vh-3.5rem)]
          transition-all duration-300 ease-in-out flex-shrink-0
          fixed md:relative top-[3.5rem] md:top-0 left-0 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                {/* Collapse Toggle */}
                <div className="hidden md:flex justify-end p-3 border-b border-gray-100">
                    <button
                        onClick={onToggleCollapse}
                        className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                        title={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" strokeWidth={1.5}/>
                        ) : (
                            <ChevronLeft className="w-4 h-4" strokeWidth={1.5}/>
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col h-[calc(100%-57px)] py-4 px-3 space-y-1">

                    {/* Main Nav (Documents) */}
                    {mainNavItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            title={isCollapsed ? item.label : ''}
                            className={({isActive}) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group relative ${
                                    isActive
                                        ? 'bg-gray-100 text-gray-900 border-l-4 border-blue-500 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } ${isCollapsed ? 'justify-center' : ''}`
                            }
                        >
                            {({isActive}) => (
                                <>
                                    <item.icon
                                        className={`w-4 h-4 flex-shrink-0 ${
                                            isActive
                                                ? 'text-blue-600'
                                                : 'text-gray-500 group-hover:text-gray-700'
                                        }`}
                                        strokeWidth={1.5}
                                    />
                                    {!isCollapsed && (
                                        <span className="text-sm flex items-center gap-1">
                                        {item.label}
                                            {item.locked && (
                                                <Lock className="w-3 h-3 text-gray-400" strokeWidth={1.5}/>
                                            )}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}


                    {/* Divider */}
                    <div className="border-t border-gray-200 my-2"/>

                    {/* Settings Items */}
                    {settingsNavItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            title={isCollapsed ? item.label : ''}
                            className={({isActive}) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group relative ${
                                    isActive
                                        ? 'bg-gray-100 text-gray-900 border-l-4 border-blue-500 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } ${isCollapsed ? 'justify-center' : ''}`
                            }
                        >
                            {({isActive}) => (
                                <>
                                    <item.icon
                                        className={`w-4 h-4 flex-shrink-0 ${
                                            isActive
                                                ? 'text-blue-600'
                                                : 'text-gray-500 group-hover:text-gray-700'
                                        }`}
                                        strokeWidth={1.5}
                                    />
                                    {!isCollapsed && (
                                        <span className="text-sm">{item.label}</span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}

                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
