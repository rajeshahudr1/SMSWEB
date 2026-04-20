/* dashboard.js */
'use strict';
var T=function(k,f){return (typeof SMS_T==='function')?SMS_T(k,f):(f||k);};
var _chart = null;

function hasPerm(p) {
    if (window._DASH_IS_ADMIN) return true;
    return (window._DASH_PERMS || []).indexOf(p) !== -1;
}

function renderBlock(wrapperId, bodyId, items) {
    var visible = items.filter(function(it) { return hasPerm(it.perm); });
    // Hide entire block if user has no permission for any item
    if (!visible.length) {
        $(wrapperId).addClass('d-none');
        return;
    }
    $(wrapperId).removeClass('d-none');
    var h = '<div class="list-group list-group-flush">';
    visible.forEach(function(it) {
        h += '<a href="' + it.url + '" class="list-group-item list-group-item-action d-flex align-items-center py-2 px-3" style="font-size:13px;">';
        h += '<span class="d-flex align-items-center justify-content-center rounded me-2 bg-' + it.color + '-lt" style="width:30px;height:30px;"><i class="bi ' + it.icon + ' text-' + it.color + '"></i></span>';
        h += '<span class="flex-fill">' + it.label + '</span>';
        h += '<span class="badge bg-' + it.color + '-lt fw-semibold">' + (it.count || 0).toLocaleString() + '</span>';
        h += '</a>';
    });
    h += '</div>';
    $(bodyId).html(h);
}

function loadDashboard() {
    var cid = $('#selCompany').length ? ($('#selCompany').val() || '') : '';
    var df = $('#dateFrom').val() || '';
    var dt = $('#dateTo').val() || '';
    var params = [];
    if (cid && cid !== 'all') params.push('company_id=' + encodeURIComponent(cid));
    if (df) params.push('date_from=' + encodeURIComponent(df));
    if (dt) params.push('date_to=' + encodeURIComponent(dt));
    var url = BASE_URL + '/dashboard/stats' + (params.length ? '?' + params.join('&') : '');

    // Update label
    if (df || dt) {
        var label = 'Showing: ' + (df || 'start') + ' to ' + (dt || 'now');
        $('#dateRangeLabel').text(label);
    } else {
        $('#dateRangeLabel').text('Showing: All time');
    }

    // Loading state
    $('#blockParts,#blockVehicles,#blockLocations').html('<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm"></div></div>');
    $('#todayTotal,#totalUsers,#totalRoles,#totalLangs').text('–');

    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(res) {
            if (!res || res.status !== 200) {
                $('#blockParts,#blockVehicles,#blockLocations').html('<div class="text-center py-3 text-danger small">Failed: '+(res?res.message:'no response')+'</div>');
                return;
            }
            var d = res.data || {};
            var p = d.parts || {}, v = d.vehicles || {}, l = d.locations || {}, s = d.system || {};

            // Top summary cards - show/hide based on permission
            $('#todayTotal').text((d.today_total || 0).toLocaleString());

            if (hasPerm('view_users')) {
                $('#cardUsers').removeClass('d-none');
                $('#totalUsers').text((s.users || 0).toLocaleString());
            } else { $('#cardUsers').addClass('d-none'); }

            if (hasPerm('view_roles')) {
                $('#cardRoles').removeClass('d-none');
                $('#totalRoles').text((s.roles || 0).toLocaleString());
            } else { $('#cardRoles').addClass('d-none'); }

            if (hasPerm('view_master_languages')) {
                $('#cardLangs').removeClass('d-none');
                $('#totalLangs').text((s.languages || 0).toLocaleString());
            } else { $('#cardLangs').addClass('d-none'); }

            // Parts block - hide entire block if no part permission
            renderBlock('#wrapParts', '#blockParts', [
                { label: 'Part Types',     count: p.part_types,     icon: 'bi-tags',          color: 'blue',   url: '/part-types',     perm: 'view_part_types' },
                { label: 'Part Brands',    count: p.part_brands,    icon: 'bi-bookmark',      color: 'indigo', url: '/part-brands',    perm: 'view_part_brands' },
                { label: 'Part Groups',    count: p.part_groups,    icon: 'bi-collection',    color: 'cyan',   url: '/part-groups',    perm: 'view_part_groups' },
                { label: 'Part Locations', count: p.part_locations, icon: 'bi-geo',           color: 'teal',   url: '/part-locations', perm: 'view_part_locations' },
                { label: 'Part Sides',     count: p.part_sides,     icon: 'bi-arrows-expand', color: 'azure',  url: '/part-sides',     perm: 'view_part_sides' },
            ]);

            // Vehicles block
            renderBlock('#wrapVehicles', '#blockVehicles', [
                { label: 'Categories', count: v.vehicle_categories, icon: 'bi-grid',       color: 'teal',   url: '/vehicle-categories', perm: 'view_vehicle_categories' },
                { label: 'Fuel Types', count: v.vehicle_fuels,      icon: 'bi-fuel-pump',  color: 'orange', url: '/vehicle-fuels',      perm: 'view_vehicle_fuels' },
                { label: 'Years',      count: v.vehicle_years,      icon: 'bi-calendar3',  color: 'cyan',   url: '/vehicle-years',      perm: 'view_vehicle_years' },
                { label: 'Types',      count: v.vehicle_types,      icon: 'bi-truck',      color: 'blue',   url: '/vehicle-types',      perm: 'view_vehicle_types' },
                { label: 'Makes',      count: v.vehicle_makes,      icon: 'bi-building',   color: 'indigo', url: '/vehicle-makes',      perm: 'view_vehicle_makes' },
                { label: 'Models',     count: v.vehicle_models,     icon: 'bi-car-front',  color: 'purple', url: '/vehicle-models',     perm: 'view_vehicle_models' },
                { label: 'Variants',   count: v.vehicle_variants,   icon: 'bi-sliders',    color: 'pink',   url: '/vehicle-variants',   perm: 'view_vehicle_variants' },
                { label: 'Engines',    count: v.vehicle_engines,    icon: 'bi-gear-wide',  color: 'red',    url: '/vehicle-engines',    perm: 'view_vehicle_engines' },
            ]);

            // Locations block
            renderBlock('#wrapLocations', '#blockLocations', [
                { label: 'Countries', count: l.countries, icon: 'bi-globe2',  color: 'orange', url: '/countries', perm: 'view_countries' },
                { label: 'States',    count: l.states,    icon: 'bi-map',     color: 'teal',   url: '/states',    perm: 'view_states' },
                { label: 'Cities',    count: l.cities,    icon: 'bi-pin-map', color: 'cyan',   url: '/cities',    perm: 'view_cities' },
            ]);

            // Activity chart
            var chart = d.activity_chart || [];
            if (chart.length && typeof Chart !== 'undefined') {
                if (_chart) _chart.destroy();
                var ctx = document.getElementById('activityChart');
                if (!ctx) return;
                _chart = new Chart(ctx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: chart.map(function(r) { return r.label; }),
                        datasets: [
                            { label: 'Create', data: chart.map(function(r) { return r.create; }), backgroundColor: 'rgba(47,179,68,.7)', borderRadius: 4 },
                            { label: 'Update', data: chart.map(function(r) { return r.update; }), backgroundColor: 'rgba(66,153,225,.7)', borderRadius: 4 },
                            { label: 'Delete', data: chart.map(function(r) { return r.delete; }), backgroundColor: 'rgba(214,57,57,.7)', borderRadius: 4 },
                            { label: 'Import', data: chart.map(function(r) { return r['import']; }), backgroundColor: 'rgba(174,62,201,.7)', borderRadius: 4 },
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
                            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } }
                        }
                    }
                });
            }
        },
        error: function(xhr) {
            var msg='HTTP '+xhr.status;try{var r=JSON.parse(xhr.responseText);if(r.message)msg+=': '+r.message;}catch(e){}
            $('#blockParts,#blockVehicles,#blockLocations').html('<div class="text-center py-3 text-danger small">Error: '+msg+'</div>');
        }
    });
}

$(function() {
    loadDashboard();

    // Company change
    $(document).on('change', '#selCompany', function() { loadDashboard(); });

    // Date filter
    $('#btnApplyDate').on('click', function() { loadDashboard(); });
    $('#btnClearDate').on('click', function() {
        $('#dateFrom').val('');
        $('#dateTo').val('');
        loadDashboard();
    });

    // Enter key on date inputs
    $('#dateFrom,#dateTo').on('keypress', function(e) {
        if (e.which === 13) loadDashboard();
    });
});