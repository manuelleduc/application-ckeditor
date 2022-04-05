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
(function() {
  'use strict';

  function showImageWizard(editor, widget) {
    require(['imageWizard'], function(imageWizard) {
      var resourceReference;
      if (editor.widgets && editor.widgets.focused) {
        resourceReference = editor.widgets.focused.data.resourceReference;
      }
      imageWizard({
        editor: editor,
        resourceReference: resourceReference,
        macroData: widget.data
      }).done(function(data) {
        // TODO: Find out how to insert a widget. Compare with xwiki-macro... 
        if (widget && widget.element) {
          widget.setData(data);
        } else {
          var element = CKEDITOR.dom.element.createFromHtml(widget.template.output(), editor.document);
          var wrapper = editor.widgets.wrapElement(element, widget.name);
          var temp = new CKEDITOR.dom.documentFragment(wrapper.getDocument());

          // Append wrapper to a temporary document. This will unify the environment in which #data listeners work when
          // creating and editing widget.
          temp.append(wrapper);

          editor.widgets.initOn(element, widget, data);
          editor.widgets.finalizeCreation(temp);
        }
      });
    });
  }

  CKEDITOR.plugins.add('xwiki-image', {
    requires: 'xwiki-image-old',
    init: function(editor) {
      this.initImageDialogWidget(editor);
    },
    initImageDialogWidget: function(editor) {
      var imagePlugin = this;
      var imageWidget = editor.widgets.registered.image;
      this.overrideImageWidget(editor, imageWidget);
      
      imageWidget.insert = function() {
        showImageWizard(editor, this);
      };
      imageWidget.edit = function(event) {
        // Prevent the default behavior because we want to use our custom image dialog.
        event.cancel();
        showImageWizard(editor, this);
      };
    },
    overrideImageWidget: function(editor, imageWidget) {
      CKEDITOR.plugins.registered['xwiki-image-old'].overrideImageWidget(editor, imageWidget);

      var originalInit = imageWidget.init;
      imageWidget.init = function() {
        originalInit.call(this);
        // var imageCaption = this.parts.figure.figcaption
        // var serializedResourceReference = this.parts.image.getAttribute('data-reference');
        // if (serializedResourceReference) {
        //   this.setData('resourceReference', CKEDITOR.plugins.xwikiResource
        //     .parseResourceReference(serializedResourceReference));
        // }
      };

      var originalData = imageWidget.data;
      imageWidget.data = function() {
        var resourceReference = this.data.resourceReference;
        // if (resourceReference) {
        //   this.parts.image.setAttribute('data-reference', CKEDITOR.plugins.xwikiResource
        //     .serializeResourceReference(resourceReference));
        // }
        // originalData.call(this);
      };
    }
  });
})();
