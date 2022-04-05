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


  function initImageStyleField(cb) {
    var imageStylesField = $('#imageStyles');
    if (imageStylesField) {
      const restURL = `${XWiki.contextPath}/rest/wikis/${XWiki.currentWiki}/imageStyles`;
      $.getJSON(`${restURL}/default`,
        $.param({'documentReference': XWiki.Model.serialize(XWiki.currentDocument.documentReference)}))
        .done((defaultStyle) => {
          var settings = {
            preload: true,
            load: function(typedText, callback) {
              $.getJSON(restURL).done((values) => {
                console.log('>>>', values);
                const imageStyles = values.imageStyles.map((value) => ({
                  label: value.prettyName,
                  value: value.identifier
                }));
                callback(imageStyles);
                console.log(defaultStyle, 'POUET');
                // Sets the default value once the values are loaded.
                imageStylesField.data('selectize').addItem(defaultStyle.defaultStyle);
                cb();

              }).fail(callback);
            }
          };

          imageStylesField.xwikiSelectize(settings);
        }).fail((...args) => {
        // TODO
        console.log('fail', args);
      });
    }
  }

  function initCaptionField() {
    const activation = $('#imageCaptionActivation');
    if (activation) {
      activation.change(function() {
        $("#imageCaption").prop('disabled', !this.checked);
      });
    }
  }

  function addChangeImageButton(insertButton, modal) {
    var selectImageButton = $('<button type="button" class="btn btn-default pull-left"></button>')
      .text('TODO Back')
      .prependTo(insertButton.parent());
    selectImageButton.on('click', function() {
      var macroData = getFormData(modal);
      console.log('macroData back to selector', macroData)
      modal.data('output', {
        action: 'selectImage',
        editor: modal.data('input').editor,
        macroData: macroData
      }).modal('hide');
    });
  }

  // Fetch modal content from a remote template the first time the image dialog editor is opened.
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
          initCaptionField();
          initImageStyleField(function() {
            modal.data('initialized', true);
            $('.image-editor-modal button.btn-primary').prop('disabled', false);
            updateForm(modal);
          });


        }).fail(function() {
        // TODO: deal with error handling.
        modal.data('initialized', true);
      });
    } else {
      updateForm(modal);
    }
  }

  function getFormData(modal) {
    var resourceReference = modal.data('input').macroData.resourceReference;
    var output = {
      resourceReference: resourceReference,
      imageStyle: $('#imageStyles').val(),
      alignment: $('#advanced [name="alignment"]').val(),
      border: $('#advanced [name="imageBorder"]').is(':checked'),
      textWrap: $('#advanced [name="textWrap"]').is(':checked'),
      alt: $('#altText').val(),
      hasCaption: $("#imageCaptionActivation").is(':checked'),
      imageCaption: $("#imageCaption").val(),
      width: $("#imageWidth").val(),
      height: $("#imageHeight").val(),
      src: CKEDITOR.plugins.xwikiResource.getResourceURL(resourceReference, modal.data('input').editor)
    };
    return output;
  }

  // Update the form according to the modal input data.
  // 
  function updateForm(modal) {
    var macroData = modal.data('input').macroData || {};

    // Switch back to the default tab
    $('.image-editor a[href="#standard"]').tab('show');

    // Style
    console.log('macroData.imageStyle', macroData.imageStyle);
    if(macroData.imageStyle) {
      $('#imageStyles')[0].selectize.setValue(macroData.imageStyle);
    }

    // Alt
    $('#altText').val(macroData.alt);


    // Caption
    $('#imageCaptionActivation').prop('checked', macroData.hasCaption);
    if(macroData.hasCaption) {
      $('#imageCaption').val(macroData.imageCaption);
      $('#imageCaption').prop('disabled', false);
    } else {
      $('#imageCaption').val('');
      $('#imageCaption').prop('disabled', true);
    }

    // Image size
    $('#imageWidth').val(macroData.width);
    $('#imageHeight').val(macroData.height);

    // Border
    $('#imageBorder').prop('checked', macroData.border);

    // Alignment
    $('#advanced [name="alignment"]').val(macroData.alignment);

    // Text Wrap
    $('#advanced [name="textWrap"]').prop('checked', macroData.textWrap);

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
        var output = getFormData(modal);
        modal.data('output', output).modal('hide');
      });

      addChangeImageButton(insertButton, modal);
    }
  });
});
