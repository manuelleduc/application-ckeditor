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
define('imageSelector', ['jquery', 'modal', 'resource', 'xwiki-skinx'], function($, $modal, resource) {
  'use strict';

  function getSelected(instance) {
    /* jshint camelcase: false */
    return instance.get_selected(false)[0];
  }

  function validateSelection(instance) {
    var selected = getSelected(instance);
    return selected && selected.startsWith("attachment:");
  }

  // TODO: should be loaded modularily and provided by the UIX for the image selector tab.
  function initDocumentTree(modal) {
    $('.attachments-tree').xtree()
      .one('ready.jstree', function(event, data) {
        data.instance.openTo("document:" + XWiki.Model.serialize(XWiki.currentDocument.getDocumentReference()));
      })
      .on('changed.jstree', function(event, data) {
        if (validateSelection(data.instance)) {
          saveSelectedImageReference(getSelected(data.instance), modal);
        } else {
          removeSelectedImageReference(modal);
        }
      });
  }

  function initDocumentUpload(editor, modal) {
    $("#upload form input.button").click(function(event) {
      event.preventDefault();
      var loader = editor.uploadRepository.create($("#fileUploadField").prop('files')[0]);
      loader.on('uploaded', function(evt) {
        var resourceReference = evt.sender.responseData.message.resourceReference;
        saveSelectedImageReference(resourceReference, modal);
        // TODO: show success and stop spinner
      });

      // Return non-false value will disable fileButton in dialogui,
      // below listeners takes care of such situation and re-enable "send" button.
      loader.on('error', function() {
        // TODO: show error and stop spinner
        console.log('TODO error', arguments);
      });
      loader.on('abort', function() {
        // TODO: show error and stop spinner
        console.log('TODO abort', arguments);
      });

      // TODO: show spinner
      loader.loadAndUpload(editor.config.filebrowserUploadUrl);
    });
  }

  function getEntityReference(reference) {
    var separatorIndex = reference.indexOf(':');
    var nodeType = reference.substr(0, separatorIndex);
    var nodeStringReference = reference.substr(separatorIndex + 1);
    return XWiki.Model.resolve(nodeStringReference, XWiki.EntityType.byName(nodeType));
  }

  function saveSelectedImageReference(imageReference, modal) {
    modal.data('imageReference', {
      value: resource.convertEntityReferenceToResourceReference(getEntityReference(imageReference))
    });
    $('.image-selector-modal button.btn-primary').prop('disabled', false);
  }

  function removeSelectedImageReference(modal) {
    modal.data('imageReference', {});
    $('.image-selector-modal button.btn-primary').prop('disabled', true);
  }

  function initialize(modal) {
    var params = modal.data('input');

    if (!modal.data('initialized')) {
      // TODO: start by a single document tree and file upload, then move toward a modular approach to load pane 
      //  according to an UIX. The main difficulty is to allow UIXs to send their attachments back to the form.
      var url = new XWiki.Document(XWiki.Model.resolve('CKEditor.ImageSelectorService', XWiki.EntityType.DOCUMENT))
        .getURL('get');
      $.get(url, $.param({language: $('html').attr('lang')}))
        .done(function(html, textState, jqXHR) {
          var imageSelector = $('.image-selector');
          var requiredSkinExtensions = jqXHR.getResponseHeader('X-XWIKI-HTML-HEAD');
          $(params.editor.document.$).loadRequiredSkinExtensions(requiredSkinExtensions);
          imageSelector.html(html);
          imageSelector.removeClass('loading');
          initDocumentTree(modal);
          initDocumentUpload(params.editor, modal);
          modal.data('initialized', true);
        }).fail(function() {
        // TODO: deal with error handling.
        modal.data('initialized', true);
      });
    }
  }

  // Initialize the modal.
  /**
   * TODO:
   * - Provide an API to pass on the selected image to the next step.
   */

  // TOOD: Use a data property to know if the content has been loaded, that way the content is only loaded once.
  return $modal.createModalStep({
    'class': 'image-selector-modal',
    title: 'TITLE', // TODO: translation
    acceptLabel: 'SELECT', // TODO: translation
    content: '<div class="image-selector loading"></div>',
    onLoad: function() {
      var modal = this;
      var selectButton = modal.find('.modal-footer .btn-primary');
      // Make the modal larger.
      modal.find('.modal-dialog').addClass('modal-lg');

      // TODO: template:
      // See https://getbootstrap.com/docs/4.2/components/navs/#tabs for the tabs (one per selector)
      // Then a https://getbootstrap.com/docs/4.2/components/forms/ for each tab
      // Same for the pane (one default tab + 1 advanced one (or an expandable field as we do for the macros?)

      modal.on('shown.bs.modal', function() {
        initialize(modal);
      });
      selectButton.on('click', function() {
        console.log('after click',modal.data('input'));
        var macroData = modal.data('input').macroData || {};
        macroData.resourceReference = modal.data('imageReference').value
        if(macroData.resourceReference) {
          // FIXME: this is probably not necessary! But is does fix the issue.
          macroData.resourceReference.typed = false;
        }
        console.log('macroData out selector', macroData);
        var output = {
          macroData: macroData,
          editor: modal.data('input').editor
        };
        modal.data('output', output).modal('hide');
      });
    }
  });
});
