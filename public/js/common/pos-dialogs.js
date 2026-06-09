'use strict';
/**
 * pos-dialogs.js — themable confirm + prompt dialogs shared across every POS
 * page (main /sales screen, plus all the sub-pages rendered through
 * pos-layout.ejs: orders, customers, drafts, payments-pending, settings, etc.).
 *
 * Without this file in scope, posConfirm/posPrompt fall back to the native
 * browser dialogs (which render `[object Object]` when called with the
 * options form, and ignore custom button labels / icons).
 *
 * Both helpers DELEGATE to identically-named globals if they already exist —
 * pos.js defines them too, and we don't want to override the bound state on
 * the main sell screen.
 */
(function () {
    if (typeof window === 'undefined') return;
    if (typeof window.jQuery === 'undefined') return;          // requires jQuery
    if (typeof window.posConfirm === 'function' && typeof window.posPrompt === 'function') return;

    var $ = window.jQuery;

    if (typeof window.posConfirm !== 'function') {
        /* posConfirm — overridable confirm dialog.
             Forms:
               posConfirm(msg, onYes)
               posConfirm(msg, onYes, opts)
               posConfirm({ msg, onConfirm, title, confirmText, cancelText, confirmColor, icon, iconColor })
        */
        window.posConfirm = function (msg, onYes, opts) {
            if (msg && typeof msg === 'object' && !Array.isArray(msg)) {
                opts = msg;
                onYes = opts.onConfirm || opts.onYes;
                msg = opts.msg || opts.message || '';
            }
            opts = opts || {};
            var title = opts.title || '';
            var confirmText = opts.confirmText || 'Confirm';
            var cancelText = opts.cancelText || 'Cancel';
            var confirmColor = opts.confirmColor || 'var(--pv2-danger, #dc2626)';
            var icon = opts.icon || 'bi-exclamation-triangle-fill';
            var iconColor = opts.iconColor || 'var(--pv2-warning, #f59e0b)';

            var $ov = $('#posConfirmOv');
            if (!$ov.length) {
                $('body').append(
                    '<div id="posConfirmOv" class="co-overlay" style="position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;background:rgba(11,18,32,.45);" onclick="if(event.target===this)$(this).hide();">'
                  +   '<div class="co-box" style="max-width:380px;width:92%;text-align:center;padding:26px 24px;border-radius:14px;background:#fff;box-shadow:0 30px 60px rgba(0,0,0,.25);font-family:inherit;">'
                  +     '<div id="posConfirmIcon" style="font-size:40px;margin-bottom:10px;"></div>'
                  +     '<h5 id="posConfirmTitle" style="font-size:15px;font-weight:800;margin:0 0 6px;color:var(--pv2-text,#1a2332);display:none;"></h5>'
                  +     '<p id="posConfirmMsg" style="font-size:13.5px;font-weight:500;margin:0 0 20px;color:var(--pv2-text,#1a2332);white-space:pre-line;"></p>'
                  +     '<div style="display:flex;gap:10px;justify-content:center;">'
                  +       '<button class="pm-btn cancel" id="posConfirmNo" style="flex:0 0 auto;padding:10px 22px;border:1px solid var(--pv2-border,#e5e7eb);background:#fff;color:var(--pv2-text,#1a2332);border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;"></button>'
                  +       '<button class="pm-btn" id="posConfirmYes" style="flex:0 0 auto;padding:10px 22px;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;"></button>'
                  +     '</div>'
                  +   '</div>'
                  + '</div>'
                );
                $ov = $('#posConfirmOv');
            }
            $('#posConfirmIcon').html('<i class="bi ' + icon + '" style="color:' + iconColor + ';"></i>');
            if (title) { $('#posConfirmTitle').text(title).show(); } else { $('#posConfirmTitle').hide(); }
            $('#posConfirmMsg').text(msg);
            $('#posConfirmNo').text(cancelText);
            $('#posConfirmYes').text(confirmText).css('background', confirmColor);
            $ov.css('display', 'flex');
            $('#posConfirmNo').off('click').on('click', function () { $ov.hide(); });
            $('#posConfirmYes').off('click').on('click', function () { $ov.hide(); if (onYes) onYes(); });
        };
    }

    if (typeof window.posPrompt !== 'function') {
        /* posPrompt — themed text-input dialog. Replaces window.prompt(). */
        window.posPrompt = function (opts) {
            opts = opts || {};
            var title = opts.title || '';
            var msg = opts.msg || '';
            var placeholder = opts.placeholder || '';
            var defaultValue = opts.defaultValue != null ? String(opts.defaultValue) : '';
            var required = !!opts.required;
            var multiline = !!opts.multiline;
            var confirmText = opts.confirmText || 'OK';
            var cancelText = opts.cancelText || 'Cancel';
            var confirmColor = opts.confirmColor || 'var(--pv2-brand, #008060)';
            var icon = opts.icon || 'bi-pencil-square';
            var iconColor = opts.iconColor || 'var(--pv2-brand, #008060)';

            var $ov = $('#posPromptOv');
            if (!$ov.length) {
                $('body').append(
                    '<div id="posPromptOv" class="co-overlay" style="position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;background:rgba(11,18,32,.45);" onclick="if(event.target===this)$(this).hide();">'
                  +   '<div class="co-box" style="max-width:420px;width:92%;text-align:left;padding:24px;border-radius:14px;background:#fff;box-shadow:0 30px 60px rgba(0,0,0,.25);font-family:inherit;">'
                  +     '<div id="posPromptIcon" style="font-size:30px;text-align:center;margin-bottom:8px;"></div>'
                  +     '<h5 id="posPromptTitle" style="font-size:15px;font-weight:800;margin:0 0 6px;color:var(--pv2-text,#1a2332);text-align:center;display:none;"></h5>'
                  +     '<p id="posPromptMsg" style="font-size:13px;color:var(--pv2-muted,#6b7280);margin:0 0 14px;text-align:center;white-space:pre-line;"></p>'
                  +     '<div id="posPromptInputWrap"></div>'
                  +     '<div id="posPromptError" style="font-size:11.5px;color:var(--pv2-danger,#dc2626);margin-top:6px;display:none;"></div>'
                  +     '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">'
                  +       '<button class="pm-btn cancel" id="posPromptNo" style="padding:10px 22px;border:1px solid var(--pv2-border,#e5e7eb);background:#fff;color:var(--pv2-text,#1a2332);border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;"></button>'
                  +       '<button class="pm-btn" id="posPromptYes" style="padding:10px 22px;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;"></button>'
                  +     '</div>'
                  +   '</div>'
                  + '</div>'
                );
                $ov = $('#posPromptOv');
            }

            var inputHtml = multiline
                ? '<textarea id="posPromptInput" rows="3" style="width:100%;padding:10px 12px;border:1px solid var(--pv2-border,#e5e7eb);border-radius:8px;font-size:13.5px;resize:vertical;font-family:inherit;outline:none;"></textarea>'
                : '<input id="posPromptInput" type="text" style="width:100%;padding:10px 12px;border:1px solid var(--pv2-border,#e5e7eb);border-radius:8px;font-size:13.5px;height:42px;outline:none;font-family:inherit;"/>';
            $('#posPromptInputWrap').html(inputHtml);
            var $inp = $('#posPromptInput');
            $inp.attr('placeholder', placeholder).val(defaultValue);

            $('#posPromptIcon').html('<i class="bi ' + icon + '" style="color:' + iconColor + ';"></i>');
            if (title) { $('#posPromptTitle').text(title).show(); } else { $('#posPromptTitle').hide(); }
            $('#posPromptMsg').text(msg);
            $('#posPromptNo').text(cancelText);
            $('#posPromptYes').text(confirmText).css('background', confirmColor);
            $('#posPromptError').hide().text('');

            function close() { $ov.hide(); }
            function submit() {
                var val = $('#posPromptInput').val();
                if (required && !String(val || '').trim()) {
                    $('#posPromptError').text('This field is required.').show();
                    return;
                }
                close();
                if (opts.onConfirm) opts.onConfirm(val);
            }
            $('#posPromptNo').off('click').on('click', function () { close(); if (opts.onCancel) opts.onCancel(); });
            $('#posPromptYes').off('click').on('click', submit);
            $inp.off('keydown.posPrompt').on('keydown.posPrompt', function (e) {
                if (e.key === 'Escape') { e.preventDefault(); close(); if (opts.onCancel) opts.onCancel(); }
                if (!multiline && e.key === 'Enter') { e.preventDefault(); submit(); }
            });

            $ov.css('display', 'flex');
            setTimeout(function () { $inp.trigger('focus').trigger('select'); }, 30);
        };
    }
})();
