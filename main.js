/**
 * Created by АНТОША on 21.06.2016.
 */
(function() {
    joint.shapes.basic.DecoratedRect = joint.shapes.basic.Generic.extend({
        markup: '<g class="rotatable"><g class="scalable"><rect/></g><image/><text/></g>',

        defaults: joint.util.deepSupplement({
            type: 'basic.Rect',
            attrs: {
                'rect': { 'follow-scale': true, width: 80, height: 40 },

                'image':{ 'ref-x': 2, 'ref-y': 2, ref: 'rect', width: 12, height: 12 }
            }
        }, joint.shapes.basic.Generic.prototype.defaults)
    });

    graph = new joint.dia.Graph;
    paper = new joint.dia.Paper({ el: $('#paper-parent-expand'), width: window.screen.availWidth, height: window.screen.availHeight, gridSize: 15, model: graph,
        defaultLink: new joint.dia.Link({
            attrs: {
                '.connection': { id: 'arrow'},

                '.marker-target': { id: "arrow_endpoint", d: 'M 10 0 L 0 5 L 10 10 z' }
            },
            labels: [

                { position: 0.37, attrs: { text: {id:'actiontext', text: 'A', fill: 'black', 'font-family': 'sans-serif' },
                    rect: {id:'actionrect',fill: '#CEC7FE', stroke: '#CEC7FE', 'stroke-width': 20, rx: 20, ry: 20 }

                }},

                { position: 0.63, attrs: { text: {id:'guardtext', text: 'G', fill: 'black', 'font-family': 'sans-serif' },
                    rect: {id:'guardrect',fill: '#EFCBF5', stroke: '#EFCBF5', 'stroke-width': 20, rx: 20, ry: 20, } }},
                { position: 0.45, attrs: { text: {class:'hide', text: 'Action text', fill: 'black', 'font-family': 'sans-serif',transform:'translate(-75,-50)' },
                    rect: {class:'hide',fill: '#CEC7FE', stroke: '#CEC7FE', 'stroke-width': 20,transform:'translate(-75,-50)', rx: 1, ry: 1  }

                }},
                { position: 0.55, attrs: { text: {class:'hide', text: 'Guard text', fill: 'black', 'font-family': 'sans-serif',transform:'translate(75,50)' },
                    rect: {class:'hide',fill: '#EFCBF5', stroke: '#EFCBF5', 'stroke-width': 20,transform:'translate(75,50)',width:'200',height:'70', rx: 1, ry: 1  }

                }}

            ]
        })

    });

    r1 = new joint.shapes.basic.Rect({

        position: { x: 20, y: 20 },
        size: { width: 150, height: 150 },
        attrs: { rect: {magnet: 'true',
                        id: 'baserect',
                        rx: 5,
                        ry: 5  },
                 text: { text: 'Parent'  }}

    });
    r2 = new joint.shapes.basic.DecoratedRect({
        position: { x: 160, y: 160 },

        attrs: { rect: { id: 'handler' },
                 image:{ 'xlink:href': 'resize-handle.png' }


        }
    });


    r1.embed(r2);




    graph.on('change:size', function(cell, newPosition, opt) {

        if (opt.skipParentHandler) return;

        if (cell.get('embeds') && cell.get('embeds').length) {
            // If we're manipulating a parent element, let's store
            // it's original size to a special property so that
            // we can shrink the parent element back while manipulating
            // its children.
            cell.set('originalSize', cell.get('size'));
        }
    });

    graph.on('change:position', function(cell, newPosition, opt) {

        if (opt.skipParentHandler) return;

        if (cell.get('embeds') && cell.get('embeds').length) {
            // If we're manipulating a parent element, let's store
            // it's original position to a special property so that
            // we can shrink the parent element back while manipulating
            // its children.
            cell.set('originalPosition', cell.get('position'));
        }

        var parentId = cell.get('parent');
        if (!parentId) return;

        var parent = graph.getCell(parentId);
        var parentBbox = parent.getBBox();

        if (!parent.get('originalPosition')) parent.set('originalPosition', parent.get('position'));
        if (!parent.get('originalSize')) parent.set('originalSize', parent.get('size'));

        var originalPosition = parent.get('originalPosition');
        var originalSize = parent.get('originalSize');

        var newX = originalPosition.x;
        var newY = originalPosition.y;
        var newCornerX = originalPosition.x + originalSize.width  ;
        var newCornerY = originalPosition.y + originalSize.height ;

        _.each(parent.getEmbeddedCells(), function(child) {

            var childBbox = child.getBBox();

            if (childBbox.x < newX) { newX = childBbox.x; }
            if (childBbox.y < newY) { newY = childBbox.y; }
            if (childBbox.corner().x > newCornerX ) { newCornerX = childBbox.corner().x + 20; }
            if (childBbox.corner().y > newCornerY ) { newCornerY = childBbox.corner().y + 19; }
            if (childBbox.corner().x < newCornerX ) { newCornerX = childBbox.corner().x + 20; }
            if (childBbox.corner().y < newCornerY ) { newCornerY = childBbox.corner().y + 19; }

        });

        // Note that we also pass a flag so that we know we shouldn't adjust the
        // `originalPosition` and `originalSize` in our handlers as a reaction
        // on the following `set()` call.
        parent.set({
            position: { x: newX, y: newY },
            size: { width: newCornerX - newX, height: newCornerY - newY }
        }, { skipParentHandler: true });

    });




    paper.on('blank:pointerdblclick', //paper doubleclick starts function
        function(event) {
            r3 = r1.clone(); // creating parent object clone
            r4 = r2.clone();//creating resize handler clone
            r3.position(event.clientX, event.clientY); //positioning parent object by mouse coords
            r4.position(event.clientX + 133, event.clientY + 135);//positioning handler
            r3.embed(r4); //grouping parent and handler objects
            graph.addCells([r3,r4]); //adding parent and handler

        }

    );



    function setGrid(paper, gridSize, color) {
        // Set grid size on the JointJS paper object (joint.dia.Paper instance)
        paper.options.gridSize = gridSize;
        // Draw a grid into the HTML 5 canvas and convert it to a data URI image
        var canvas = $('<canvas/>', { width: gridSize, height: gridSize });
        canvas[0].width = gridSize;
        canvas[0].height = gridSize;
        var context = canvas[0].getContext('2d');
        context.beginPath();
        context.rect(1, 1, 15, 15);
        context.fillStyle = color || '#AAAAAA';
        context.fill();
        context.strokeStyle = '#E8E8EA'
        context.stroke();
        // Finally, set the grid background image of the paper container element.
        var gridBackgroundImage = canvas[0].toDataURL('image/png');
        paper.$el.css('background-image', 'url("' + gridBackgroundImage + '")');
    }

    setGrid(paper, 15,'#FFFFFF')


}());

function save() {
    bootbox.prompt({
        title: "Enter save file name",
        value: "savedata",
        callback: function(result) {
            if (result === null) {
                bootbox.alert("Operation canceled");

            } else {
                savedata =  JSON.stringify(graph); //creating JSON string from graph (core jointJS object)

                var file = new File([savedata],result + ".json", {type: "application/json"});
                saveAs(file);
            }
        }
    });




}




function loadFile() {
    var input, file, fr;

    if (typeof window.FileReader !== 'function') {
        bootbox.alert("The file API isn't supported on this browser yet.");
        return;
    }

    input = document.getElementById('fileinput');
    if (!input) {
        bootbox.alert("Couldn't find the fileinput element.");
    }
    else if (!input.files) {
        bootbox.alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
        bootbox.alert("Please select a file before clicking 'Load'");

    }
    else {
        file = input.files[0];
        fr = new FileReader();
        fr.onload = receivedText;
        fr.readAsText(file);
        function receivedText(e) {
            lines = e.target.result;
            var newArr = JSON.parse(lines);
            graph.fromJSON(JSON.parse(lines));
        }
    }



}
function addNodes(){

    bootbox.prompt("Enter node text. Separate with comma", function(res) {
        if (res === null) {
            bootbox.alert("Operation cacneled");
        } else {
            nodes = res;
            var nodearray = nodes.split(',');

            for (i = 0; i < nodearray.length; i++) {
                r3 = r1.clone(); // creating parent object clone
                r4 = r2.clone();//creating resize handler clone
                r3.position(150 + i*150, 150); //positioning parent object by mouse coords
                r4.position(150 + 133 + i*150, 150 + 135 );//positioning handler
                r3.embed(r4); //grouping parent and handler objects
                r3.attr('text/text', nodearray[i])
                graph.addCells([r3, r4]); //adding parent and handler
            }

        }
    });


}
var selected = null;

paper.on('cell:pointerclick', function(cellView) {

    if(selected != null){
        if(selected.isLink()){
            selected = cellView.model;

        }else {
            selected.attr('rect/id', 'baserect');
            selected = cellView.model;
            selected.attr('rect/id', 'select')
        }
    }


    else {


            selected = cellView.model;
            selected.attr('rect/id', 'select')
        }



});
paper.on('blank:pointerclick', function() {
    if(selected != null) {
        if (selected.isLink()){

            return;
        }else {
            selected.attr('rect/id', 'baserect');
        }
    }
    selected = null;
});
function deleteNode(){

    if (selected) selected.remove();

}
function addGuard() {
    if(selected == null){
        bootbox.alert("Choose link by clicking before editing")
    }else if(selected.isLink() == false){
        bootbox.alert("You can't add guards to nodes")
    }else {
        bootbox.dialog({                        //js alert with bootstrap library
            title: "Choose Guard sample",
            message: '<select id="Ultra" >' +
            '<option >Delete Guard</option>' +
            '<option >Guard1</option>' +
            '<option >Guard2</option>' +
            '<option >Guard3</option>' +
            '<option >Guard4</option>' +
            '<option >Guard5</option>' +
            '<option >Guard6</option>' +
            '</select>',
            buttons: {
                success: {
                    label: "Ok",
                    className: "btn-primary",
                    callback: function () {
                        var name = $('#Ultra').val();
                        if (name == "Delete Guard") {
                            selected.label(1, {attrs: {text: {id: 'guardtext'}, rect: {id: 'guardrect'}}});
                            selected.label(3, {attrs: {text: {class: 'hide'}, rect: {class: 'hide'}}});

                        } else {
                            selected.label(1, {
                                attrs: {
                                    text: {id: 'guardtextvisible'},
                                    rect: {id: 'guardrectvisible'}
                                }
                            });
                            selected.label(3, {
                                attrs: {
                                    text: {class: 'guardtexthide', text: name},
                                    rect: {class: 'guardrecthide'}
                                }
                            });

                        }

                    }
                }
            }
        });
    }

}
function addAction() {
    if(selected == null){
        bootbox.alert("Choose link by clicking before editing")
    }else if(selected.isLink() == false){
        bootbox.alert("You can't add actions to nodes")
    }else {
        bootbox.dialog({                        //js alert with bootstrap library
            title: "Choose Action sample",
            message: '<select id="Ultra" >' +
            '<option >Delete Action</option>' +
            '<option >Action1</option>' +
            '<option >Action2</option>' +
            '<option >Action3</option>' +
            '<option >Action4</option>' +
            '<option >Action5</option>' +
            '<option >Action6</option>' +
            '</select>',
            buttons: {
                success: {
                    label: "Ok",
                    className: "btn-primary",
                    callback: function () {
                        var name = $('#Ultra').val();
                        if (name == "Delete Action") {
                            selected.label(0, {attrs: {text: {id: 'actiontext'}, rect: {id: 'actionrect'}}});
                            selected.label(2, {attrs: {text: {class: 'hide'}, rect: {class: 'hide'}}});

                        } else {
                            selected.label(0, {
                                attrs: {
                                    text: {id: 'actiontextvisible'},
                                    rect: {id: 'actionrectvisible'}
                                }
                            });
                            selected.label(2, {
                                attrs: {
                                    text: {class: 'actiontexthide', text: name},
                                    rect: {class: 'actionrecthide'}
                                }
                            });

                        }

                    }
                }
            }
        });
    }
}
function editText(){
    if(selected != null){

        bootbox.prompt({                        //js alert with bootstrap library
            title: "Enter new text",
            value: selected.attr('text/text'),
            callback: function(result) {
                if (result != null) {
                    selected.attr('text/text', result);
                }
            }
        });


    }
}