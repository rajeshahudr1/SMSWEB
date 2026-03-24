/* part-types-form.js */
'use strict';

$(function() {
    var FD = window._FORM_DATA || {};
    var T  = function(k,f){ return SMS_T(k,f); };

    /* ── Image preview on file select ── */
    $('#fImage').on('change', function() {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toastr.error(T('part_types.image_upload_hint','Max 5 MB')); $(this).val(''); return; }
        var reader = new FileReader();
        reader.onload = function(e) {
            $('#newImagePreview').html(
                '<div class="border rounded p-2 mb-2"><div class="text-muted small mb-1"><i class="bi bi-file-earmark-image me-1"></i>' + T('general.preview','Preview') + '</div>' +
                '<img src="' + e.target.result + '" class="rounded" style="max-width:100%;max-height:160px;object-fit:contain;"/></div>'
            );
        };
        reader.readAsDataURL(file);
        $('#fRemoveImg').prop('checked', false);
    });

    /* ── Remove image toggle ── */
    $('#fRemoveImg').on('change', function() {
        if ($(this).is(':checked')) { $('#fImage').val(''); $('#newImagePreview').html(''); }
    });

    /* ── Click image → popup showing BOTH images ── */
    $(document).on('click', '.sms-img-preview', function() {
        var $img     = $(this);
        var title    = $img.data('title') || T('part_types.image_preview','Image Preview');
        var uploaded = $img.data('uploaded') || '';
        var external = $img.data('external') || '';
        if (!uploaded && !external) return;

        $('#imgPopupTitle').text(title);
        var html = '<div class="row g-3">';

        if (uploaded) {
            html += '<div class="' + (external ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
            html += '<div class="text-muted small mb-2"><i class="bi bi-cloud-upload me-1 text-success"></i><strong>' + T('part_types.image_uploaded','Uploaded') + '</strong></div>';
            html += '<img src="' + H.esc(uploaded) + '" class="rounded" style="max-width:100%;max-height:240px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>' + T('general.no_image','No image') + '</div>\'"/>';
            html += '<div class="mt-2"><a href="' + H.esc(uploaded) + '" target="_blank" class="btn btn-sm btn-outline-primary" download><i class="bi bi-download me-1"></i>' + T('general.download','Download') + '</a></div>';
            html += '</div></div>';
        }

        if (external) {
            html += '<div class="' + (uploaded ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
            html += '<div class="text-muted small mb-2"><i class="bi bi-link-45deg me-1 text-info"></i><strong>' + T('general.external_url','External URL') + '</strong></div>';
            html += '<img src="' + H.esc(external) + '" class="rounded" style="max-width:100%;max-height:240px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>' + T('general.no_image','No image') + '</div>\'"/>';
            html += '<div class="mt-2"><a href="' + H.esc(external) + '" target="_blank" class="btn btn-sm btn-outline-info"><i class="bi bi-box-arrow-up-right me-1"></i>' + T('general.open_file','Open') + '</a></div>';
            html += '<div class="mt-1 small text-muted text-break" style="word-break:break-all;">' + H.esc(external) + '</div>';
            html += '</div></div>';
        }

        html += '</div>';
        $('#imgPopupBody').html(html);
        bootstrap.Modal.getOrCreateInstance($('#modalImageForm')[0]).show();
    });

    /* ── Form submit ── */
    $('#frmPartType').on('submit', function(e) {
        e.preventDefault();
        var partName = $('#fPartName').val().trim();
        if (!partName) { toastr.error(T('part_types.name','Part name') + ' is required.'); $('#fPartName').focus(); return; }

        var $btn = $('#btnSubmit');
        var fd   = new FormData(this);

        var translations = {};
        (FD.langIds || []).forEach(function(lid) {
            var val = $('input[name="trans_' + lid + '"]').val();
            if (val && val.trim()) translations[lid] = val.trim();
            fd.delete('trans_' + lid);
        });
        fd.append('translations', JSON.stringify(translations));

        btnLoading($btn);
        $.ajax({
            url: $(this).attr('action'), type: 'POST', data: fd, processData: false, contentType: false,
            success: function(r) {
                btnReset($btn);
                if (r.status === 200 || r.status === 201) { toastr.success(r.message || T('btn.saved','Saved.')); setTimeout(function() { window.location = '/part-types'; }, 800); }
                else toastr.error(r.message || T('general.error','Error.'));
            },
            error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
        });
    });
});