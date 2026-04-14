/* notifications.js v5 — Global bell + dropdown + job tracker
   Loaded after jQuery + app.js via main.ejs */
'use strict';
document.addEventListener('DOMContentLoaded', function() {
    if (typeof jQuery === 'undefined') return;
    var $ = jQuery;
    if (typeof BASE_URL === 'undefined') return;

    var _pollInterval = null;
    var _activeJobs = {};
    var _ddPage = 1, _ddLoading = false, _ddHasMore = true;

    /* ── Bell count polling ── */
    function fetchUnreadCount() {
        $.get(BASE_URL + '/notifications/unread-count').done(function(res) {
            if (res && res.status === 200 && res.data) {
                var c = parseInt(res.data.count) || 0;
                $('.sms-notif-dot').text(c);
                if (c > 0) $('.sms-notif-dot').addClass('sms-notif-dot--active').show();
                else $('.sms-notif-dot').removeClass('sms-notif-dot--active');
            }
        });
    }
    window.fetchUnreadCount = fetchUnreadCount;
    fetchUnreadCount();
    _pollInterval = setInterval(fetchUnreadCount, 30000);

    /* ── Dropdown: load 5 per page, scroll = more ── */
    function loadDropdown(reset) {
        var $body = $('#notifDropdownBody');
        if (!$body.length) return;
        if (reset) { _ddPage = 1; _ddHasMore = true; $body.html(''); }
        if (_ddLoading || !_ddHasMore) return;
        _ddLoading = true;
        if (_ddPage === 1) $body.html('<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>');

        $.get(BASE_URL + '/notifications/api-list', { per_page: 5, page: _ddPage }).done(function(res) {
            _ddLoading = false;
            if (!res || res.status !== 200 || !res.data) {
                if (_ddPage === 1) $body.html('<div class="text-center text-muted py-3 small">Failed to load.</div>');
                return;
            }
            var items = (res.data.data || []);
            var pg = res.data.pagination || {};
            if (_ddPage === 1) $body.html('');
            if (!items.length && _ddPage === 1) {
                $body.html('<div class="text-center text-muted py-4 px-3"><i class="bi bi-bell-slash mb-2 d-block" style="font-size:28px;opacity:.3;"></i><p class="mb-0 small">No notifications</p></div>');
                _ddHasMore = false;
                return;
            }
            var h = '';
            items.forEach(function(n) {
                var cls = n.is_read ? '' : 'bg-azure-lt';
                var icon = n.icon || 'bi-bell';
                var color = n.color || 'primary';
                h += '<a href="#" class="dropdown-item d-flex gap-2 py-2 px-3 notif-dd-item ' + cls + '" data-uuid="' + n.uuid + '"' + (n.link_url ? ' data-link="' + H.esc(n.link_url) + '"' : '') + ' style="white-space:normal;">';
                h += '<div><i class="bi ' + icon + ' text-' + color + '" style="font-size:16px;"></i></div>';
                h += '<div class="flex-fill" style="min-width:0;">';
                h += '<div class="fw-medium" style="font-size:12px;">' + H.esc(n.title) + '</div>';
                h += '<div class="text-muted" style="font-size:11px;">' + H.esc(n.message || '').substring(0, 60) + '</div>';
                h += '<div class="text-muted" style="font-size:10px;">' + smsFormatDateTime(n.created_at) + '</div>';
                h += '</div></a>';
            });
            $body.append(h);
            _ddPage++;
            _ddHasMore = pg.current_page < pg.last_page;
        }).fail(function() { _ddLoading = false; });
    }

    /* ── Detail modal ── */
    function showNotifDetail(uuid) {
        var $modal = $('#notifDetailModal');
        if (!$modal.length) {
            $('body').append(
                '<div class="modal fade" id="notifDetailModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width:900px;"><div class="modal-content">' +
                '<div class="modal-header py-3"><h5 class="modal-title fw-semibold"><i class="bi bi-bell me-2 text-primary"></i>Notification Details</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
                '<div class="modal-body" id="notifDetailBody"></div>' +
                '<div class="modal-footer py-2"><button type="button" class="btn btn-ghost-secondary btn-sm" data-bs-dismiss="modal">Close</button></div>' +
                '</div></div></div>'
            );
            $modal = $('#notifDetailModal');
        }
        var $body = $('#notifDetailBody');
        $body.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
        bootstrap.Modal.getOrCreateInstance($modal[0]).show();

        // Mark read
        $.ajax({ url: BASE_URL + '/notifications/' + uuid + '/read', type: 'PATCH' });

        $.get(BASE_URL + '/notifications/' + uuid).done(function(res) {
            if (!res || res.status !== 200 || !res.data) { $body.html('<div class="alert alert-danger m-3">Not found.</div>'); return; }
            var n = res.data;
            var h = '<div class="p-2">';
            h += '<div class="d-flex align-items-center gap-2 mb-3"><i class="bi ' + (n.icon||'bi-bell') + ' text-' + (n.color||'primary') + '" style="font-size:24px;"></i>';
            h += '<div><h5 class="mb-0">' + H.esc(n.title) + '</h5><div class="text-muted small">' + smsFormatDateTime(n.created_at) + '</div></div></div>';
            if (n.message) h += '<p>' + H.esc(n.message) + '</p>';

            if (n.link_url) {
                h += '<div class="mb-3"><a href="' + H.esc(n.link_url) + '" class="btn btn-sm btn-primary"><i class="bi bi-arrow-right me-1"></i>' + H.esc(n.link_label || 'View Details') + '</a></div>';
            }

            if (n.file_path && n.file_url) {
                var retDays = (n.meta && n.meta.retentionDays) ? n.meta.retentionDays : 7;
                h += '<div class="border rounded p-3 mb-3 bg-light">';
                h += '<div class="d-flex align-items-center gap-3">';
                h += '<i class="bi bi-file-earmark-arrow-down text-success" style="font-size:28px;"></i>';
                h += '<div class="flex-fill"><strong>' + H.esc(n.file_name || 'Export File') + '</strong></div>';
                h += '<a href="' + H.esc(n.file_url) + '" class="btn btn-primary" download><i class="bi bi-download me-1"></i>Download</a>';
                h += '</div>';
                if (n.meta && n.meta.durationMs) {
                    var dur = n.meta.durationMs, durStr;
                    if (dur < 1000) durStr = dur + 'ms';
                    else if (dur < 60000) durStr = (dur / 1000).toFixed(1) + 's';
                    else { var m = Math.floor(dur / 60000), s = Math.round((dur % 60000) / 1000); durStr = m + 'm ' + s + 's'; }
                    h += '<div class="text-muted small mt-2"><i class="bi bi-stopwatch me-1"></i>Export completed in <strong>' + durStr + '</strong></div>';
                }
                h += '<div class="text-muted small mt-1"><i class="bi bi-clock me-1"></i>This file will be available for ' + retDays + ' days and will be automatically deleted after that.</div>';
                h += '</div>';
            }

            if (n.job && n.job.results && n.job.results.length) {
                var results = n.job.results;
                var errors = results.filter(function(r) { return r.status === 'error'; });
                var success = results.filter(function(r) { return r.status === 'success'; });
                h += '<div class="d-flex gap-2 mb-3">';
                h += '<span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + success.length + ' imported</span>';
                if (errors.length) h += '<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + errors.length + ' errors</span>';
                h += '</div>';
                if (errors.length) {
                    h += '<div style="max-height:400px;overflow:auto;"><table class="table table-sm table-bordered mb-0" style="font-size:11px;white-space:nowrap;"><thead class="table-light"><tr>';
                    h += '<th>#</th><th>Name</th><th>Type</th><th>Make</th><th>Year</th><th>Start Yr</th><th>M.Init</th><th>End Yr</th><th>M.Final</th><th>Image URL</th><th>Error</th><th>Retry</th>';
                    h += '</tr></thead><tbody>';
                    errors.forEach(function(r, i) {
                        var d = r.data || {};
                        h += '<tr class="table-danger" id="notifImpRow' + i + '">';
                        h += '<td>' + r.row + '</td>';
                        h += '<td><input type="text" class="form-control form-control-sm nimp-name" value="' + H.esc(r.name || d.name || d['model name'] || '') + '"/></td>';
                        h += '<td><input type="text" class="form-control form-control-sm nimp-type" value="' + H.esc(d.vehicle_type || d['vehicle type'] || d.type || '') + '"/></td>';
                        h += '<td><input type="text" class="form-control form-control-sm nimp-make" value="' + H.esc(d.vehicle_make || d['vehicle make'] || d.make || '') + '"/></td>';
                        h += '<td><input type="text" class="form-control form-control-sm nimp-year" value="' + H.esc(d.vehicle_year || d['vehicle year'] || d.year || '') + '" style="width:55px;"/></td>';
                        h += '<td><input type="number" class="form-control form-control-sm nimp-sy" value="' + H.esc(d.start_year || d['start year'] || d['start_year'] || '') + '" style="width:60px;"/></td>';
                        h += '<td><input type="number" class="form-control form-control-sm nimp-mi" value="' + H.esc(d.month_initial || d['month initial'] || d['month_initial'] || '') + '" style="width:48px;" min="1" max="12"/></td>';
                        h += '<td><input type="number" class="form-control form-control-sm nimp-ey" value="' + H.esc(d.end_year || d['end year'] || d['end_year'] || '') + '" style="width:60px;"/></td>';
                        h += '<td><input type="number" class="form-control form-control-sm nimp-mf" value="' + H.esc(d.month_final || d['month final'] || d['month_final'] || '') + '" style="width:48px;" min="1" max="12"/></td>';
                        h += '<td><input type="text" class="form-control form-control-sm nimp-iu" value="' + H.esc(d.image_url || d['image url'] || d['image_url'] || '') + '" style="width:80px;"/></td>';
                        h += '<td class="small text-danger">' + H.esc(r.message) + '</td>';
                        h += '<td><button class="btn btn-sm btn-outline-warning btn-notif-retry" data-idx="' + i + '"><i class="bi bi-arrow-repeat"></i></button></td>';
                        h += '</tr>';
                    });
                    h += '</tbody></table></div>';
                }
            }

            if (n.job && (n.job.status === 'processing' || n.job.status === 'pending')) {
                h += '<div class="border rounded p-3 mb-3"><div class="fw-medium mb-2"><i class="bi bi-hourglass-split me-1 text-warning"></i>Processing...</div>';
                h += '<div class="progress mb-2" style="height:20px;"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width:' + (n.job.progress||0) + '%">' + (n.job.progress||0) + '%</div></div>';
                h += '<div class="text-muted small">' + (n.job.processed_rows||0) + ' / ' + (n.job.total_rows||0) + ' rows</div></div>';
            }
            h += '</div>';
            $body.html(h);
            fetchUnreadCount();
        });
    }
    window.showNotifDetail = showNotifDetail;

    /* ── Retry from notification detail ── */
    $(document).on('click', '.btn-notif-retry', function() {
        var $tr = $(this).closest('tr');
        var payload = {
            name: $tr.find('.nimp-name').val().trim(),
            vehicle_type: $tr.find('.nimp-type').val().trim(),
            vehicle_make: $tr.find('.nimp-make').val().trim(),
            vehicle_year: $tr.find('.nimp-year').val().trim(),
            month_initial: $tr.find('.nimp-mi').val().trim(),
            month_final: $tr.find('.nimp-mf').val().trim(),
            start_year: $tr.find('.nimp-sy').val().trim(),
            end_year: $tr.find('.nimp-ey').val().trim(),
            image_url: $tr.find('.nimp-iu').val().trim()
        };
        if (!payload.name || !payload.vehicle_type || !payload.vehicle_make) { toastr.error('Name, Type, Make required.'); return; }
        var $b = $(this); btnLoading($b);
        $.post(BASE_URL + '/vehicle-models/import/single', payload).done(function(res) {
            btnReset($b);
            if (res.status === 200 || res.status === 201) {
                $tr.removeClass('table-danger').addClass('table-success');
                $tr.find('input').prop('disabled', true).addClass('bg-light');
                $tr.find('td:eq(10)').html('<span class="text-success small">OK</span>');
                $tr.find('td:last').html('\u2014');
                toastr.success('Imported.');
            } else toastr.error(res.message || 'Failed.');
        }).fail(function() { btnReset($b); toastr.error('Error.'); });
    });

    /* ── Job tracker ── */
    window.smsTrackJob = function(jobUuid, opts) {
        opts = opts || {};
        var timer = setInterval(function() {
            $.get(BASE_URL + '/notifications/job/' + jobUuid).done(function(res) {
                if (!res || res.status !== 200) return;
                var job = res.data;
                if (job.status === 'completed' || job.status === 'failed') {
                    clearInterval(timer);
                    delete _activeJobs[jobUuid];
                    fetchUnreadCount();
                    if (typeof opts.onComplete === 'function') opts.onComplete(job);
                }
            });
        }, 2000);
        _activeJobs[jobUuid] = timer;
    };

    /* ── Events ── */
    $(document).on('show.bs.dropdown', '.notif-dropdown', function() { loadDropdown(true); });
    $('#notifDropdownBody').on('scroll', function() {
        if (this.scrollTop + this.clientHeight >= this.scrollHeight - 30) loadDropdown(false);
    });
    $(document).on('click', '.notif-dd-item', function(e) {
        e.preventDefault();
        var uuid = $(this).data('uuid');
        var link = $(this).data('link');
        if (uuid) {
            $(this).removeClass('bg-azure-lt fw-semibold');
            // Mark as read
            $.ajax({ url: BASE_URL + '/notifications/' + uuid + '/read', type: 'PATCH' });
            if (link) {
                // Navigate to link page
                window.location.href = link;
            } else {
                showNotifDetail(uuid);
                setTimeout(function() { fetchUnreadCount(); }, 500);
            }
        }
    });
    $(document).on('click', '#btnMarkAllRead', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $btn = $(this);
        $btn.html('<span class="spinner-border spinner-border-sm me-1"></span>...');
        $.ajax({ url: BASE_URL + '/notifications/mark-all-read', type: 'POST',
            success: function(r) {
                $btn.html('Mark all read');
                if (r && r.status === 200) { toastr.success('All marked as read.'); fetchUnreadCount(); loadDropdown(true); }
                else toastr.error('Failed.');
            },
            error: function() { $btn.html('Mark all read'); toastr.error('Network error.'); }
        });
    });

}); // DOMContentLoaded