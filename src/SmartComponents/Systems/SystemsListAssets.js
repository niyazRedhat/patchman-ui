import React from 'react';
import { Link } from 'react-router-dom';
import { fetchApplicableSystemAdvisoriesApi } from '../../Utilities/api';
import { remediationIdentifiers } from '../../Utilities/constants';
import {
    createAdvisoriesIcons, createUpgradableColumn,
    remediationProvider, createOSColumn, createPackagesColumn
} from '../../Utilities/Helpers';
import './SystemsListAssets.scss';
import { sortable } from '@patternfly/react-table';

export const systemsListColumns = () => [
    {
        key: 'operating_system',
        title: 'OS',
        renderFunc: value => createOSColumn(value),
        props: {
            width: 5
        }
    },
    {
        key: 'baseline_name',
        title: 'Template',
        renderFunc: (value, _, row) => value
            ? <Link to={{ pathname: `/templates/${row.baseline_id}` }}>{value}</Link>
            : 'No template',
        props: {
            width: 5
        }
    },
    {
        key: 'applicable_advisories',
        title: 'Installable advisories',
        props: {
            width: 15
        },
        renderFunc: value => createAdvisoriesIcons(value)
    },
    {
        key: 'packages_installed',
        title: 'Installed packages',
        renderFunc: (packageCount, systemID) => createPackagesColumn(packageCount, systemID),
        props: {
            width: 10
        }
    }
];

export const advisorySystemsColumns = () => [
    {
        key: 'os',
        title: 'OS',
        renderFunc: value => createOSColumn(value),
        props: {
            width: 5
        }
    },
    {
        key: 'baseline_name',
        title: 'Template',
        renderFunc: (value, _, row) => value
            ? <Link to={{ pathname: `/templates/${row.baseline_id}` }}>{value}</Link>
            : 'No template',
        props: {
            width: 5
        }
    },
    {
        key: 'status',
        title: 'Status',
        props: {
            width: 5,
            isStatic: true
        },
        transforms: [sortable]
    }
];

export const packageSystemsColumns = [
    {
        key: 'display_name',
        title: 'Name',
        composed: ['facts.os_release', 'display_name'],
        props: {
            width: 40
        }
    },
    {
        key: 'tags',
        title: 'Tags',
        props: { width: 10, isStatic: true }
    },
    {
        key: 'installed_evra',
        title: 'Installed version',
        props: {
            width: 15
        }
    },
    {
        key: 'available_evra',
        title: 'Latest version',
        props: {
            width: 15
        }
    },
    {
        key: 'upgradable',
        title: 'Status',
        props: {
            width: 20,
            isStatic: true
        },
        renderFunc: value => createUpgradableColumn(value)
    }
];

const isRemediationDisabled = (row) => {
    const { applicable_advisories: applicableAdvisories } = row || {};
    return applicableAdvisories && applicableAdvisories.every(typeSum => typeSum === 0);
};

const isPatchSetRemovalDisabled = (row) => {
    const { baseline_name: baselineName } = row || {};
    return !baselineName || (typeof baselineName === 'string' && baselineName === '');
};

export const systemsRowActions = (
    showRemediationModal,
    showTemplateAssignSystemsModal,
    openUnassignSystemsModal,
    row
) => {
    return [
        {
            title: 'Apply all applicable advisories',
            isDisabled: isRemediationDisabled(row),
            onClick: (event, rowId, rowData) => {
                fetchApplicableSystemAdvisoriesApi({
                    id: rowData.id,
                    limit: -1,
                    'filter[status]': 'in:Installable'
                }).then(res =>
                    showRemediationModal(
                        remediationProvider(
                            res.data.map(item => item.id),
                            rowData.id,
                            remediationIdentifiers.advisory
                        )
                    )
                );
            }
        },
        ...(showTemplateAssignSystemsModal ? [{
            title: 'Assign to a template',
            onClick: (event, rowId, rowData) => {
                showTemplateAssignSystemsModal({ [rowData.id]: true });
            }
        },
        {
            title: 'Remove from a template',
            isDisabled: isPatchSetRemovalDisabled(row),
            onClick: (event, rowId, rowData) => {
                openUnassignSystemsModal([rowData.id]);
            }
        }
        ] : [])
    ];
};
