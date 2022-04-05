/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
// TODO: xwiki-skinx is a macro selector specific module, it needs to be moved somewhere common.
define('imageEditor', ['jquery', 'modal', 'xwiki-skinx'], function($, $modal) {
  'use strict';

  function addChangeImageButton(insertButton, modal) {
    var selectImageButton = $('<button type="button" class="btn btn-default pull-left"></button>')
      .text('TODO Back')
      .prependTo(insertButton.parent());
    selectImageButton.on('click', function() {
      modal.data('output', {
        action: 'selectImage',
        editor: modal.data('input').editor
      }).modal('hide');
    });
  }

  function initialize(modal) {
    var params = modal.data('input');
    if (!modal.data('initialized')) {
      var url = new XWiki.Document(XWiki.Model.resolve('CKEditor.ImageEditorService', XWiki.EntityType.DOCUMENT))
        .getURL('get');
      $.get(url, $.param({
        language: $('html').attr('lang'),
        isHTML5: $(params.editor.document).data('syntax') !== 'annotatedxhtml/1.0'
      }))
        .done(function(html, textState, jqXHR) {
          var imageEditor = $('.image-editor');
          var requiredSkinExtensions = jqXHR.getResponseHeader('X-XWIKI-HTML-HEAD');
          $(params.editor.document.$).loadRequiredSkinExtensions(requiredSkinExtensions);
          imageEditor.html(html);
          imageEditor.removeClass('loading');
          modal.data('initialized', true);
          $('.image-editor-modal button.btn-primary').prop('disabled', false);
        }).fail(function() {
        // TODO: deal with error handling.
        modal.data('initialized', true);
      });
    }
  }

  return $modal.createModalStep({
    'class': 'image-editor-modal',
    title: 'TITLE', // TODO: translation
    acceptLabel: 'INSERT', // TODO: translation
    content: '<div class="image-editor loading"></div>',
    onLoad: function() {
      var modal = this;
      var insertButton = modal.find('.modal-footer .btn-primary');
      // Make the modal larger.
      modal.find('.modal-dialog').addClass('modal-lg');

      modal.on('shown.bs.modal', function() {
        initialize(modal);
      });
      insertButton.on('click', function() {
        // TODO: complete output with the selected settings.
        var resourceReference = modal.data('input').imageReference;
        var output = {
          resourceReference: resourceReference,
          // classes: [$("#imageStyles").val()],
          align: undefined, // TODO - complete the classes with values from the advanced pane 
          alt: $('#altText').val(),
          hasCaption: $("#imageCaptionActivation").val() === 'on',
          width: $("#imageWidth").val(),
          height: $("#imageHeight").val(),
          src: CKEDITOR.plugins.xwikiResource.getResourceURL(resourceReference, modal.data('input').editor), // TODO?
          'data-test': 'OK'
        };
        modal.data('output', output).modal('hide');
      });

      addChangeImageButton(insertButton, modal);
    }
  });
});
