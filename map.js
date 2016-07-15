import './map.html'
import './map.css'

import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker';

import * as L  from 'leaflet'
import * as d3 from 'd3'
import { $ } from 'meteor/jquery'
import 'leaflet/dist/leaflet.css' // BUG: had to import leaflet with npm meteor install

import {  Nodes } from '../../../api/collections.js'


var map, points = []

Template.filterByCategory.onRendered( function() {

  console.log("map template rendered")

  // init map style / tiles
  L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images'
  var url = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png'
  // var url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  var attrib = "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors"

  console.log(L);
  var layer = new L.TileLayer(url, {
      minZoom: 1,
      maxZoom: 16,
      attribution: attrib
  })

  // create map div
  map = L.map('map').setView([35.0, 50.0], 2)
  map.addLayer(layer)

  // add d3 map overlay
  let mapReady = false
  function addMapOverlay() {
      let mapOverlay = L.d3SvgOverlay(function(selection,projection){

      console.log("overlay pl");
      selection
        .attr("id", "circles")
        .selectAll("circle")
          .data(points)
          .enter()
          .append("circle")
          .attr("id", function(d) {
              return d.id
          })
          .attr("cx", function(d){ return projection.latLngToLayerPoint(d.latLng).x })
          .attr("cy", function(d){ return projection.latLngToLayerPoint(d.latLng).y })
          .style("fill", "red")
          .attr("r", 10)

      console.log(circles);
    });

    mapOverlay.addTo(map)
    mapReady = true
  }

  self = this
  self.autorun(function(auto) {

    let network = Template.instance().data.network.get()

    // get nodes
    var nodes = Nodes.find().fetch()
    console.log(nodes.length, 'nodes')

    // create map points
    points = nodes
      .filter(function(node){ // filter out points that does not have lat/lng
        return node.data.lat && node.data.lng
      })
      .map(function(d) {
        return {
            latLng: new L.LatLng(d.data.lat, d.data.lng),
            id: d.data.id
        }
    })
    console.log(points.length, "points on the map")

    if(points.length && !mapReady) {
      addMapOverlay()
      mapReady = true
    }

    console.log(network);
    if(points.length && network) {
      updateNetwork(network)

      // bind events
      map.on("move", function(e){
        updateNetwork(network)
      })

      map.on("zoomend", function(e){
        updateNetwork(network)
      })

    }
  });


})

function getPositions() {
  let pos = {}
  let circles = d3.select("#circles")
    .selectAll('circle')

  console.log(circles);
  circles[0]
    .forEach(function(d){
      if (d) {
        let box = d.getBoundingClientRect()
        pos[d.id] = {
          x : box.left + box.width/2,
          y : box.top + box.height/2
        }
      }
    })
  return pos
}

function updateNetwork(network, pos) {

  var pos = getPositions()
  console.log("update cytoscape", pos)
  // disable network events
  $("#network").css({ "pointer-events" : "none" })
  // disable zoom to fake with other means
  network.zoomingEnabled( false )
  network.nodes().positions(function(i, node){
    return pos[i]
  })
  console.log(pos);
}


// //
// // // Template.map.rendered = function() {
// // //     // session vars
// // //     Session.set('minParamForDisplay', 0)
// // //     Session.set("D3mapCoords",{})
// // //     //In order to select if radius as to vary according to source, to target, or to both
// // //     Session.set('radiusas', 'both')
// // //     var self = this
// // //     var topogramId = this.data.topogramId
// // //     var maxRadius = 30
// // //
// // //     //  retrieve data
// // //
// // //     var edges = Edges.find().fetch(),
// // //         nodes = Nodes.find().fetch()
// // //
// // //
// // //     //Checks that the selected nodes are connected with edges and checks nodes length
// // //     var selectedNodes = nodes.filter(function(node) {
// // //         var nodeEdgesSrc = edges.filter(function(edge) {
// // //             return edge.data.source == node.data.data.id
// // //         })
// // //         var nodeEdgesTar = edges.filter(function(edge) {
// // //             return edge.data.target == node.data.data.id
// // //         })
// // //         node['nodeEdgesSrc'] = nodeEdgesSrc
// // //         node['nodeEdgesTar'] = nodeEdgesTar
// // //
// // //         return nodeEdgesSrc.length > 0 || nodeEdgesTar.length > 0
// // //     })
// // //
// // //     /*-----GeoJSON features for Nodes-----------*/
// // //     var features = []
// // //
// // //     Object.keys(selectedNodes).forEach(function(id) {
// // //         var selectedNode = selectedNodes[id]
// // //
// // //         if (!isValidCoordinate(selectedNode.data.data.lat, selectedNode.data.data.long)) {
// // //             return
// // //         } else {
// // //             // parse GeoJSON  point
// // //             var p = turf.point(
// // //                 [selectedNode.data.data.lat, selectedNode.data.data.long], {
// // //                     'topogramId': selectedNode.topogramId,
// // //                     '_id': selectedNode._id,
// // //                     'countSrc': selectedNode.nodeEdgesSrc.length,
// // //                     'countTar': selectedNode.nodeEdgesTar.length
// // //
// // //                 }
// // //             )
// // //
// // //             features.push(p)
// // //
// // //             ///add coords for gravitycentercalculation
// // //
// // //         }
// // //     })
// // //
// // //     // GeoJSON collection for Nodes
// // //     var collection = turf.featurecollection(features)
// // //     var q = []
// // //     // console.log( 'collection', collection )
// // //
// // //     //var colleccentr = turf.featurecollection( q )
// // //     // console.log( 'colleccentr', colleccentr )
// // //
// // //     /*-----GeoJSON features for Edges-----------*/
// // //
// // //     Object.keys(edges).forEach(function(id) {
// // //         // console.log('edges[ ' + id + ' ]', edges[id])
// // //
// // //         // for-loop is better than selectedNodes.filter( ... ) here since we want only one source and one target, and we can thus break the for-loop once they are found instead of looping through all selectedNodes
// // //         var sourceNode, targetNode,
// // //             srcFound = false,
// // //             tarFound = false
// // //         for (var i = 0, l = selectedNodes.length  i < l  i++) {
// // //             if (!srcFound && selectedNodes[i].data.id == edges[id].data.source) {
// // //                 sourceNode = selectedNodes[i]
// // //                 srcFound = true
// // //             } else if (!tarFound && selectedNodes[i].data.id == edges[id].data.target) {
// // //                 targetNode = selectedNodes[i]
// // //                 tarFound = true
// // //             } else if (srcFound && tarFound) break  //stop for-loop since we found our nodes
// // //         }
// // //
// // //
// // //
// // //         edges[id].data.sourcelat = sourceNode.data.lat
// // //         edges[id].data.sourcelong = sourceNode.data.lng
// // //         edges[id].data.targetlat = targetNode.data.lat
// // //         edges[id].data.targetlong = targetNode.data.lng
// // //
// // //
// // //
// // //         if ((!isValidCoordinate(edges[id].data.sourcelat, edges[id].data.sourcelong)) && (!isValidCoordinate(edges[id].data.targetlat, edges[id].data.targetlong))) {
// // //             return
// // //         } else {
// // //             // parse GeoJSON  point
// // //             var p = turf.linestring(
// // //                 [
// // //                     [edges[id].data.sourcelat, edges[id].data.sourcelong],
// // //                     [edges[id].data.targetlat, edges[id].data.targetlong]
// // //                 ], {
// // //                     //'topogramId': selectedEdge.topogramId,
// // //                     //'_id': selectedEdge._id,
// // //                     //'countSrc': selectedEdge.nodeEdgesSrc.length,
// // //                     //'countTar': selectedEdge.nodeEdgesTar.length
// // //
// // //                     // 'city': selectedNode.city,
// // //                     // 'country': selectedNode.country
// // //                 }
// // //             )
// // //
// // //             q.push(p)
// // //             //console.log("q1",q)
// // //             ///add coords for gravitycentercalculation
// // //
// // //         }
// // //     })
// // //
// // //     // GeoJSON collection for Edges
// // //     // console.log( "q2", q )
// // //     var collectionedges = turf.featurecollection(q)
// // //     // console.log( "collectionedges", collectionedges )
// // //     // console.log('collection', collection)
// // //     //var colleccentr = turf.featurecollection( q )
// // //     // console.log('colleccentr', colleccentr)
// // //
// // //     // setup map
// // //     L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images'
// // //     var url = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png'
// // //     //var url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
// // //     var attrib = "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors"
// // //     var layer = new L.TileLayer(url, {
// // //         minZoom: 2,
// // //         maxZoom: 16,
// // //         attribution: attrib
// // //     })
// // //     var map = L.map('map').setView([35.0, 50.0], 4)
// // //     map.addLayer(layer)
// // //
// // //     var svg = d3.select('#map').append('svg')
// // //         .style('position', 'absolute')
// // //         .style('top', 0)
// // //         .style('left', 0)
// // //         .style('width', d3.select('#map').style('width'))
// // //         .style('height', d3.select('#map').style('height'))
// // //
// // //     var g = svg.append('g').attr('class', 'leaflet-zoom-hide')
// // //
// // //     var transform = d3.geo.transform({
// // //             point: projectPoint
// // //         }),
// // //         path = d3.geo.path().projection(transform)
// // //     // console.log( 'path', path )
// // //     // console.log( 'transform', transform )
// // //
// // //     // radius scale
// // //     var radius = d3.scale.linear()
// // //         .domain([
// // //             Session.get('minParamForDisplay'),
// // //             d3.max(Object.keys(selectedNodes).map(function(d) {
// // //                 // console.log('selectedNodes[d].count', selectedNodes[d].nodeEdgesSrc.length + selectedNodes[d].nodeEdgesTar.length)
// // //
// // //                 return selectedNodes[d].nodeEdgesSrc.length + selectedNodes[d].nodeEdgesTar.length
// // //             }))
// // //         ])
// // //         .range([5, maxRadius])
// // //
// // //     ///IMPROVEME: Size need to be set according to the number of edges
// // //     var feature = g.selectAll('circle')
// // //         .data(collection.features).enter()
// // //         .append('circle')
// // //         .attr('r', function(d) {
// // //             //TODO:IMPLEMENT SELECTOR FOR THE RADIUS SIZE
// // //
// // //             // console.log('radius(d.properties.countSrc + d.properties.countTar)', radius(d.properties.countSrc + d.properties.countTar))
// // //             return ~~(radius(d.properties.countSrc + d.properties.countTar))
// // //         })
// // //         .style('fill', 'red')
// // //         .style('stroke', 'none')
// // //         .style('opacity', .6)
// // //     // console.log( 'feature', feature )
// // //
// // //     // Edge features
// // //
// // //     var g2 = svg.append('g').attr('class', 'leaflet-zoom-hide')
// // //     // console.log( g2 )
// // //
// // //     var featureedges = g2.selectAll('line')
// // //         .data(collectionedges.features).enter()
// // //         .append('line')
// // //         .style('stroke', 'yellow')
// // //         .style('stroke-width', '4')
// // //         .style('opacity', .8)
// // //
// // //     // console.log( "featureedges", featureedges )
// // //     d3.selectAll('line').on('mouseover', function(d) {
// // //         var infos = ''
// // //         // linestring
// // //         for (var p in d.properties) {
// // //             infos += p + ': ' + d.properties[p] + '\n'
// // //         }
// // //         // console.log( infos )
// // //     })
// // //
// // //     // define projection
// // //     map.on('resize', resetView)
// // //     map.on('move', update)
// // //     map.on('zoom', update)
// // //
// // //     d3.select('.tab')
// // //         .on('click', function() {
// // //             resetView()
// // //         })
// // //
// // //     function resetView() {
// // //         map.invalidateSize()
// // //         svg.style('width', d3.select('#map').style('width'))
// // //             .style('height', d3.select('#map').style('height'))
// // //         update()
// // //     }
// // //
// // //     function update() {
// // //         var mapBounds = map.getBounds()
// // //         var SW = map.latLngToLayerPoint(mapBounds._southWest),
// // //             NE = map.latLngToLayerPoint(mapBounds._northEast)
// // //
// // //         // console.log(NE, SW)
// // //         // console.log(Math.abs(NE.x - SW.x), Math.abs(NE.y - SW.y))
// // //
// // //         svg.attr('viewBox', SW.x + ' ' + NE.y + ' ' + Math.abs(NE.x - SW.x) + ' ' + Math.abs(NE.y - SW.y))
// // //
// // //         // points
// // //         feature.attr('transform', function(d) {
// // //             // console.log("d",d)
// // //             return 'translate(' +
// // //                 applyLatLngToLayer(map, d).x + ',' +
// // //                 applyLatLngToLayer(map, d).y + ')'
// // //
// // //         })
// // //
// // //         featureedges.attr('x1', function(d) {
// // //
// // //                 return applyLatLngToLayerForEdges(map, d.geometry.coordinates[0]).x
// // //             })
// // //             .attr('y1', function(d) {
// // //                 return applyLatLngToLayerForEdges(map, d.geometry.coordinates[0]).y
// // //             })
// // //             .attr('x2', function(d) {
// // //                 return applyLatLngToLayerForEdges(map, d.geometry.coordinates[1]).x
// // //             })
// // //             .attr('y2', function(d) {
// // //                 return applyLatLngToLayerForEdges(map, d.geometry.coordinates[1]).y
// // //             })
// // //     }
// // //     window.setInterval(resetView, 500)
// // //
// // //     // Use Leaflet to implement a D3 geometric transformation.
// // //     function projectPoint(x, y) {
// // //         var point = map.latLngToLayerPoint(map, new L.LatLng(x, y))
// // //         this.stream.point(point.x, point.y)
// // //     }
// // //
// // // }
// //
// // /*
// // Template.map.events({
// //     'click #showselectedNodes': function(event) {
// //         event.preventDefault()
// //         //var topogram = Topograms.findOne()
// //         // render
// //     }
// // })
// // */

/**
 * Copyright 2015 Teralytics AG
 *
 * @author Kirill Zhuravlev <kirill.zhuravlev@teralytics.ch>
 *
 */
L.D3SvgOverlay = (L.version < "1.0" ? L.Class : L.Layer).extend({
    includes: (L.version < "1.0" ? L.Mixin.Events : []),

    _undef: function(a){ return typeof a == "undefined" },

    _options: function (options) {
        if (this._undef(options)) {
            return this.options;
        }
        options.zoomHide = this._undef(options.zoomHide) ? false : options.zoomHide;
        options.zoomDraw = this._undef(options.zoomDraw) ? true : options.zoomDraw;

        return this.options = options;
    },

    _disableLeafletRounding: function(){
        this._leaflet_round = L.Point.prototype._round;
        L.Point.prototype._round = function(){ return this; };
    },

    _enableLeafletRounding: function(){
        L.Point.prototype._round = this._leaflet_round;
    },

    draw: function () {
        this._disableLeafletRounding();
        this._drawCallback(this.selection, this.projection, this.map.getZoom());
        this._enableLeafletRounding();
    },

    initialize: function (drawCallback, options) { // (Function(selection, projection)), (Object)options
        this._options(options || {});
        this._drawCallback = drawCallback;
    },

    // Handler for "viewreset"-like events, updates scale and shift after the animation
    _zoomChange: function (evt) {
        this._disableLeafletRounding();
        var newZoom = this._undef(evt.zoom) ? this.map._zoom : evt.zoom; // "viewreset" event in Leaflet has not zoom/center parameters like zoomanim
        this._zoomDiff = newZoom - this._zoom;
        this._scale = Math.pow(2, this._zoomDiff);
        this.projection.scale = this._scale;
        this._shift = this.map.latLngToLayerPoint(this._wgsOrigin)
            ._subtract(this._wgsInitialShift.multiplyBy(this._scale));

        var shift = ["translate(", this._shift.x, ",", this._shift.y, ") "];
        var scale = ["scale(", this._scale, ",", this._scale,") "];
        this._rootGroup.attr("transform", shift.concat(scale).join(""));

        if (this.options.zoomDraw) { this.draw() }
        this._enableLeafletRounding();
    },

    onAdd: function (map) {
        this.map = map;
        var _layer = this;

        // SVG element
        if (L.version < "1.0") {
            map._initPathRoot();
            this._svg = d3.select(map._panes.overlayPane)
                .select("svg");
            this._rootGroup = this._svg.append("g");
        } else {
            this._svg = L.svg();
            map.addLayer(this._svg);
            this._rootGroup = d3.select(this._svg._rootGroup).classed("d3-overlay", true);
        }
        this._rootGroup.classed("leaflet-zoom-hide", this.options.zoomHide);
        this.selection = this._rootGroup;

        // Init shift/scale invariance helper values
        this._pixelOrigin = map.getPixelOrigin();
        this._wgsOrigin = L.latLng([0, 0]);
        this._wgsInitialShift = this.map.latLngToLayerPoint(this._wgsOrigin);
        this._zoom = this.map.getZoom();
        this._shift = L.point(0, 0);
        this._scale = 1;

        // Create projection object
        this.projection = {
            latLngToLayerPoint: function (latLng, zoom) {
                zoom = _layer._undef(zoom) ? _layer._zoom : zoom;
                var projectedPoint = _layer.map.project(L.latLng(latLng), zoom)._round();
                return projectedPoint._subtract(_layer._pixelOrigin);
            },
            layerPointToLatLng: function (point, zoom) {
                zoom = _layer._undef(zoom) ? _layer._zoom : zoom;
                var projectedPoint = L.point(point).add(_layer._pixelOrigin);
                return _layer.map.unproject(projectedPoint, zoom);
            },
            unitsPerMeter: 256 * Math.pow(2, _layer._zoom) / 40075017,
            map: _layer.map,
            layer: _layer,
            scale: 1
        };
        this.projection._projectPoint = function(x, y) {
            var point = _layer.projection.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        };
        this.projection.pathFromGeojson =
            d3.geo.path().projection(d3.geo.transform({point: this.projection._projectPoint}));

        // Compatibility with v.1
        this.projection.latLngToLayerFloatPoint = this.projection.latLngToLayerPoint;
        this.projection.getZoom = this.map.getZoom.bind(this.map);
        this.projection.getBounds = this.map.getBounds.bind(this.map);
        this.selection = this._rootGroup;

        if (L.version < "1.0") map.on("viewreset", this._zoomChange, this);

        // Initial draw
        this.draw();
    },

    // Leaflet 1.0
    getEvents: function() { return {zoomend: this._zoomChange}; },

    onRemove: function (map) {
        if (L.version < "1.0") {
            map.off("viewreset", this._zoomChange, this);
            this._rootGroup.remove();
        } else {
            this._svg.remove();
        }
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    }

});

  L.D3SvgOverlay.version = "2.2";

// Factory method
L.d3SvgOverlay = function (drawCallback, options) {
    return new L.D3SvgOverlay(drawCallback, options);
};
