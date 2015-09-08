'use strict';

define(

        [ 'jquery', 'jqueryui', 'cytoscape'/*, 'd3', './config', './common', './adjust_css', './add_pickers', './load_plots', './events'*/ ],

function ( $      ,  _        ,  cytoscape/*      ,  d3 ,  cfg      ,  c        ,  adjust_css   ,  add_pickers   ,  load_plots   ,  events*/ ) {


  window.assert = function ( condition, message ) {
    if ( !! condition ) return;

    var msg = arguments.length < 2 ? 'assertion failed' : message;
    if ( typeof Error !== 'undefined' ) {
        throw new Error( msg );
    }
    throw msg;
}  // window.assert = function ( condition, message ) {
  window.outline = function () {

      function visit_breadth_first ( start, func ) {
          var _
          ,   queue = [ { node: start, level: 0 } ]
          ,   item
          ,   level
          ,   children
          ,   next
          ;

          while ( queue.length > 0 ) {
              item = queue.shift();
              func( item );

              children = Array.prototype.slice.call( item.node.children );
              level = item.level + 1;
              queue = queue.concat(
                  children.map( function ( n ) {
                      return { node: n, level: level };
                  } )
              );
          }
      }

      var _
      ,   width = 2
      ,   index_to_color =
              (
                  function () {
                      var mult = 360
                      ,   offset = 2/3
                      ,   step = Math.sqrt(5) - 2
                      ;
                      function h ( i ) {
                          return mult * ( ( offset + i * step ) % 1 );
                      }

                      return function ( i ) {
                          var hsl = [ h( i ) + '', '60%', '60%' ];
                          return 'hsl(' + hsl.join( ', ' ) + ')';
                      };
                  }
              )()
      ,    level = 0
      ,    max_level
      ,    $key
      ;

      $( '*' ).each( function ( _, e ) {
          var $this = $( this );
          $this.show();
          [ 'top', 'right', 'bottom', 'left' ].forEach( function ( s ) {
              var prop = 'padding-' + s;
              $this.css( prop, parseInt( $this.css( prop ) ) + 2 * width );
          } )
      } );

      $( '*' ).each( function ( _, e ) {
          var $this = $( this );
          $this.show();
          [ 'top', 'right', 'bottom', 'left' ].forEach( function ( s ) {
              var prop = 'margin-' + s;
              $this.css( prop, parseInt( $this.css( prop ) ) + 2 * width );
          } )
      } );

      visit_breadth_first( $( '#app-root' ).get( 0 ),
                           function ( next ) {
                               var _
                               ,   level = next.level
                               ,   outline = width +
                                             'px solid ' +
                                             index_to_color( level );
                               $( next.node ).css( 'outline', outline );
                               max_level = level;
                           } );

      console.log( level );
      console.log( max_level );

      $key = $( '<div></div>' ).prependTo( $( 'body' ) );

      while ( level < max_level ) {
          $( '<div></div>' ).css( {
                                    'background-color': index_to_color( level ),
                                    padding: '8px 4px',
                                    display: 'inline-block',
                                  } )
                            .appendTo( $key );
          level++;
      }
  }

    var elapsed = ( function () {
        function time () {
            return Date.now();
        }

        var last;
        function _elapsed () {
            var _
            ,   now = time()
            ,   ret = now - last
            ;
            last = now;
            return ret;
        }

        _elapsed.init = function () {
            last = time();
        }

        _elapsed.log = function () {
            var parts = Array.prototype.slice.call( arguments );
            parts.push( _elapsed() );
            console.log( parts.join( ' ' ) );
        }

        _elapsed.init();
        return _elapsed;
    } )();  // var elapsed = ( function () {

    function arrrepr ( a ) {
        return a.length > 0 ? ( '[ ' + a.join( ', ' ) + ' ]' ) : '[]';
    }

    function numeric ( a, b ) { return a - b; }

    function sorted ( array ) {
        return ( Array.prototype
                      .sort.apply( array.slice(),
                                   Array.prototype
                                        .slice.call( arguments, 1 ) ) );
    }  // function sorted ( array ) {

    function range ( m, n, s ) {
        var nargs = arguments.length;
        if ( nargs < 3 ) {
            if ( nargs < 2 ) {
                return range( 0, m, 1 );
            }
            return range( m, n, 1 );
        }

        var _
        ,   l = Math.max( 0, ( n - m ) / s )
        ,   retval = Array( l )
        ,   i = 0
        ,   j = m
        ;

        while ( i < l ) {
            retval[ i++ ] = j;
            j += s;
        }

        return retval;
    }  // function range ( m, n, s ) {

    function factorial () {
        var seen = {};
        seen[ 0 ] = 1;

        function _factorial ( n ) {
            var ret = seen[ n ];
            if ( ! seen.hasOwnProperty( n ) ) {
                ret = seen[ n ] = n * _factorial( n - 1 );
            }
            return ret;
        }

        factorial = function ( n ) {
            if ( n < 0 ) throw 'Invalid argument: ' + n;
            return _factorial( n );
        };

        return factorial.apply( this, arguments );
    }  // function factorial () {

    function ravel ( matrix ) {
        return matrix.reduce( function ( a, b ) { return a.concat( b ); } );
    }

    function prod ( arr ) {
        return arr.reduce( function ( a, b ) { return a * b; } );
    }

    function ravelprod ( matrix ) { return prod( ravel( matrix ) ); }

    function rep ( n, c ) {
        // n: non-negative integer
        // c: string or array
        // returns: string or array obtained from concatenating n copies of c

        var m = 1, s = c;

        // grow s exponentially
        while ( m < n ) {
            s = s.concat( s );
            m <<= 1;
        }

        // discard excess
        return s.slice( 0, n * c.length );
    }  // function rep ( n, c ) {

    function unique () {
        function _unique ( value, index, self ) {
            return self.indexOf( value ) === index;
        }
        unique = function ( arr ) {
            return arr.filter( _unique );
        }
        return unique.apply( this, arguments );
    }  // function unique () {

    function time () { return Date.now(); }

    function format_time ( millis, precision ) {
        var _
        ,   prec = arguments.length < 2 ? 0 : precision
        ,   parts = []
        ,   nparts = 0
        ,   milliseconds
        ,   seconds
        ,   minutes
        ,   hours
        ,   days
        ,   l, s, m, h, d
        ,   a
        ;

        function pad ( str ) {
            return ( '00' + str ).slice( -2 )
        }

        milliseconds = millis
        seconds      = Math.floor( milliseconds / 1000 );
        minutes      = Math.floor( seconds      /   60 );
        hours        = Math.floor( minutes      /   60 );
        days         = Math.floor( hours        /   24 );

        l = milliseconds % 1000;
        s = seconds      %   60;
        m = minutes      %   60;
        h = hours        %   24;
        d = days               ;

        if ( prec > 0 ) {
            a = ( ( l / 1000 ) + '' ).slice( 1, prec + 2 );
        }
        else {
            a = '';
            if ( l >= 500 ) s++;
        }

        if ( d > 0           ) { parts.push(      d       + 'd' ); nparts++; }
        if ( h > 0 || nparts ) { parts.push( pad( h )     + 'h' ); nparts++; }
        if ( m > 0 || nparts ) { parts.push( pad( m )     + 'm' ); nparts++; }
        if ( true            ) { parts.push( pad( s ) + a + 's' ); nparts++; }

        return parts.join( ' ' );
    }

  // function parse_px ( s ) {
  //     return parseInt( s.replace( /px\s*$/i, '' ) );
  // }

  // $.fn.extend( {
  //     margin: function () {
  //         var $this = $( this );
  //         return {
  //                  t: parse_px( $this.css( 'margin-top'    ) ),
  //                  r: parse_px( $this.css( 'margin-right'  ) ),
  //                  b: parse_px( $this.css( 'margin-bottom' ) ),
  //                  l: parse_px( $this.css( 'margin-left'   ) )
  //                };
  //     },

  //     lr_offset: function ( slack ) {
  //         var _
  //         ,   $this = $( this )
  //         ,   margin = $this.margin()
  //         ,   s = arguments.length > 0 ? slack : 0

  //         ,   dx = margin.r + s
  //         ,   dy = margin.b + s

  //         ;

  //         return { x: $this.outerWidth() + dx,
  //                  y: $this.outerHeight() + dy }
  //     }

  // } );

  $.extend( {

      make_signal_type: ( function () {

          $.fn.extend( {
              on_signal: function ( signal_type, listener ) {
                  var _
                  ,   cbs = signal_type.callbacks
                  ,   lis = signal_type.listeners
                  ;

                  return this.each( function () {
                      cbs.add( lis[ this ] = listener.bind( this ) );
                  } );
              },

              off_signal: function ( signal_type ) {
                  var _
                  ,   cbs = signal_type.callbacks
                  ,   lis = signal_type.listeners
                  ;

                  return this.each( function () {
                             var listener = lis[ this ];
                             if ( listener ) { cbs.remove( listener ); }
                         } );
              }
          } );

          // return function ( type ) {
          //     var callbacks = $.Callbacks();

          //     function broadcast () {
          //         console.log( 'firing ' + type );
          //         return callbacks.fire.apply( this, arguments );
          //     };

          //     return { broadcast: broadcast, // callbacks.fire,
          //              callbacks: callbacks,
          //              listeners: {} }
          // };

          return function () {
              var callbacks = $.Callbacks();

              return { broadcast: callbacks.fire,
                       callbacks: callbacks,
                       listeners: {} }
          };

        } )()

  } );  // #.extend( {

  // ----------------------------------------------------------------

  function assert ( condition, message ) {
      if ( !! condition ) return;

      var msg = arguments.length < 2 ? 'assertion failed' : message;
      if ( typeof Error !== 'undefined' ) {
          throw new Error( msg );
      }
      throw msg;
  }  // function assert ( condition, message ) {

  function get_type ( elt ) {
      return $( elt ).closest( '.input-panel' )
                     .attr( 'id' )[ 0 ]
                     .toUpperCase();
  }  // function get_type ( elt )

  // --------------------------------------------------------------

  var _
  ,   MIN_EDGE_WEIGHT = 0.05

  ,   APP
  ,   DATA
  ,   CORE
  ,   STATE
  ,   LKP
  ,   UI
  ,   POPUP
  ;

  // --------------------------------------------------------------

  ( function () {

    CORE = {

          '': null  // sentinel

        , calculate_pairwise: function ( sh2_domains, phospho_sites,
                                         feature_to_beta ) {

            return sh2_domains.map( function ( sh2 ) {
                return phospho_sites.map( function ( pho ) {
                    return CORE.pairwise_probability( sh2, pho,
                                                      feature_to_beta );
                } )
            } );

          }

        , pairwise_probability: function ( sh2_domain, phospho_site,
                                           feature_to_beta ) {

            function _to_features ( s ) {
                return s.split( '' ).map( function ( c, i ) {
                    return i + ',' + c;
                } );
            }

            function _get ( obj, key, dflt ) {
                return key in obj ? obj[ key ] : dflt;
            }

            function _sum ( array ) {
                return array.reduce( function ( a, b ) { return a + b }, 0 );
            }

            function _to_energy ( features, rules ) {
                return _sum( features.map( function ( f ) {
                    return _get( rules, f, 0 );
                } ) );
            }

            if ( sh2_domain.length == 0 || phospho_site.length == 0 ) {
                return null;
            }

            var energy = ( function () {
                var _
                ,   sh2_domain_features = _to_features( sh2_domain )
                ,   phospho_site_features = _to_features( phospho_site )
                ,   f2b = feature_to_beta
                ,   pairwise_rules = f2b.pairwise_rules
                ;

                return (

                    f2b.intercept[ '' ]

                  + _to_energy( sh2_domain_features, f2b.sh2_domain_rules )

                  + _to_energy( phospho_site_features, f2b.phospho_site_rules )

                  + _sum( sh2_domain_features.map( function ( f ) {
                      return   f in pairwise_rules
                             ? _to_energy( phospho_site_features,
                                           pairwise_rules[ f ] )
                             : 0;
                    } ) )
                )
            } )();

            var p = Math.exp( energy );
            return p/( 1 + p );
        }

        , permutations_iterator: function ( multiset ) {
            var _
            ,   a_init = [ -1 ].concat( multiset )
            ,   n = multiset.length
            ,   a, j, k, l, done
            ,   swap = function ( i, j ) {
                    var tmp = a[ i ];
                    a[ i ] = a[ j ];
                    a[ j ] = tmp;
                }
            ;

            function _advance () {
                j = n - 1;

                while ( a[ j ] >= a[ j + 1 ] ) j--;

                if ( j == 0 ) return false;

                l = n;
                while ( a[ j ] >= a[ l ] ) l--;

                swap( j, l );

                k = j + 1;
                l = n;

                while ( k < l ) swap( k++, l-- );

                return true;
            }

            function init () {
                done = false;
                a = a_init.slice();
            }

            function next () {
                if ( done ) return null;

                var ret = a.slice( 1 );

                done = ! _advance();

                return ret;
            }

            next.next = next;

            init();
            return next;

        }
        , combinations_iterator: function ( multiset, k ) {
            var _
            ,   M = sorted( multiset, numeric )
            ,   m = M.length
            ,   K, done
            ;

            function init () {
                K = M.slice( 0, k );
                done = false;
            }

            // based on http://stackoverflow.com/a/30518940/559827

            function _advance () {
                var first = 0, last = k, last_value = m, p = last;

                // 1. Find the rightmost value which could be advanced, if any
                while ( p != first && K[ p - 1 ] >= M[ --last_value ] ) --p;
                if ( p == first ) return false;

                // 2. Find the smallest value which is greater than the selected value
                for ( --p; K[ p ] < M[ last_value - 1 ]; --last_value ) ;

                // 3. Overwrite the suffix of the subset with the lexicographically smallest
                //    sequence starting with the new value
                while ( p !== last ) K[ p++ ] = M[ last_value++ ];

                return true;
            }

            function next () {
                if ( done ) return null;
                var ret = K.slice();
                done = ! _advance();
                return ret;
            }

            next.next = next;
            init();
            return next;

        }
    };  // CORE = {

    // --------------------------------------------------------------

    ( function () { // scope: define STATE

        var _
        ,   signal_types = {}
        ,   input = { S: [], P: [] }
        ,   raw_input = { S: [], P: [] }

        ,   fraction_complete
        ,   time_estimate

        ,   output = null
        ,   cancel_calculation = 0
        ;

        function normalize_input_sequence ( sequence, type ) {

            var _
            ,   ph = String.fromCharCode( 29 ) // placeholder
            ,   padchar = '~'
            ,   unallowed = new RegExp( '[^ACDEFGHIKLMNPQRSTVWY' +
                                        ph + padchar + ']',
                                        'ig' )
            ,   normalize = {
                  S: function ( sequence ) {
                      var s = normalize_length( sequence, 106 ).toUpperCase();
                      return normalize_content( s );
                  }
                , P: function ( sequence ) {
                         var _
                         ,   y = 6
                         ,   r = new RegExp( '^(.{' + y + '})Y', 'i' )

                         ,   s = sequence.replace( r, '$1' + ph )
                         ,   t = normalize_content( s )
                         ,   u = t.replace( ph, 'y' )
                         ,   v = normalize_length( u, 13 )
                         ,   w = ( v[ y ] == 'y' ) ? v
                                                   : ( v.substr( 0, y ) + 'y' +
                                                       v.substr( y ) )
                         ;

                         return w;
                     }
                }
            ;

            function repstr ( n, c ) {
                var m = 1, s = c;
                while ( m < n ) { s += s; m += m; }
                return s.substr( 0, n );
            }

            function normalize_length ( seq, length ) {
                var n = length - seq.length;
                return ( seq + repstr( n, padchar ) ).substr( 0, length );
            }

            function normalize_content ( sequence ) {
                return sequence.replace( unallowed, padchar );
            }

            normalize_input_sequence = function ( sequence, type ) {
                if ( sequence.match( /^\s*$/ ) ) { return ''; }
                return normalize[ type ]( sequence );
            };

            return normalize_input_sequence.apply( this, arguments );
        }  // function normalize_input_sequence ( sequence, type ) {

        function state_reset () { signal_types.state_reset.broadcast(); }

        function raw_input_changed ( type ) {
            signal_types.raw_input_changed.broadcast( raw_input, type );
        }

        function input_changed ( type ) {
            raw_input_changed( type );
            signal_types.input_changed.broadcast( input, type );
        }

        function busy () {
            signal_types.busy.broadcast( fraction_complete, time_estimate );
        }

        function output_changed () {
            signal_types.output_changed.broadcast( output );
        }

        STATE = {

              '': null  // sentinel

            , signal_types: signal_types

            , example: function () {
                STATE.add_sequences( 'S', LKP.S[ 'PIK3R1' ] );
                STATE.add_sequences( 'P', LKP.P[ 'RASA1' ] );

                STATE.add_sequences( 'S', LKP.S[ 'PIK3R1' ] );
                STATE.add_sequences( 'P', LKP.P[ 'RASA1' ] );

                STATE.add_sequences( 'S', LKP.S[ 'PIK3R1' ] );
                // STATE.add_sequences( 'P', LKP.P[ 'RASA1' ] );

                // STATE.calculate();
            }  // , example: function () {

            , cancel: function () { cancel_calculation = 1; }

            , calculate: ( function () {
                  function TimeUp ( msg ) {
                      this.name = 'time up';
                      this.message = arguments.length > 0 ? msg : this.name;
                  }  // function TimeUp ( msg ) {

                  function CancelJob ( msg ) {
                      this.name = 'cancel job';
                      this.message = arguments.length > 0 ? msg : this.name;
                  }  //function CancelJob ( msg ) {

                  function Reset ( msg ) {
                      this.name = 'reset';
                      this.message = arguments.length > 0 ? msg : this.name;
                  }  //function Reset ( msg ) {

                  function mk_alarm ( runfor ) {
                      var _
                      ,   disabled = false
                      ,   start = time()
                      ,   alarm = {
                                    init: function () {
                                        disabled = false;
                                        start = time();
                                        // console.log( 'ALARM: start = ' + start );
                                        return alarm;
                                    },
                                    timeup: function () {
                                        return !( disabled || time() - start < runfor );
                                    },
                                    check: function () {
                                        if ( ! alarm.timeup() ) return alarm;
                                        // var now = time();
                                        // console.log( 'ALARM: check: now = ' + now + '; start = ' + start + '; elapsed = ' + ( now - start ) + '; runfor = ' + runfor );
                                        // if ( disabled || now - start < runfor ) return alarm;
                                        throw new TimeUp();
                                    },
                                    off: function () {
                                        disabled = true;
                                        return alarm;
                                    }
                                  }
                      ;

                      return alarm;
                  }  // function mk_alarm ( runfor ) {

                  function workload ( k, j ) {

                      var _
                      ,   kfac = factorial( k )
                      ,   jfac = factorial( j )
                      ,   acc = 0
                      ,   y
                      ,   z
                      ;

                      for ( z = Math.max( 0, k - j ); z <= k; ++z ) {
                          y = k - z;
                          acc += ( kfac / factorial( z ) ) * ( ( jfac / factorial( y ) ) / factorial( j - y ) );
                      }

                      return acc;
                  }  // function workload ( k, j ) {

                  function mk_combinations_traversal ( matrix, alarm ) {

                      function to_row ( j1, i ) {
                          var j = j1 - 1, r = matrix[ i ].slice();
                          if ( j > -1 ) r[ j ] = 1 - r[ j ];
                          return r;
                      }

                      function to_prob ( p ) {
                          return ravelprod( p.map( to_row ) );
                      }

                      function check () {
                          var exc = undefined;

                          if ( alarm.timeup() ) {
                              exc = TimeUp;
                          }
                          else if ( cancel_calculation ) {
                              exc = cancel_calculation == -1 ? Reset : CancelJob;
                          }

                          if ( exc !== undefined ) {
                              throw new exc( 'interrupt calculation' );
                          }
                      }

                      var _
                      ,   k = matrix.length
                      ,   j = matrix[ 0 ].length
                      ,   multiset = rep( k, [ 0 ] ).concat( range( 1, j + 1 ) )
                      ,   c_iterator = CORE.combinations_iterator ( multiset, k )
                      ,   p_iterator = undefined

                      // STATE VARIABLES

                      ,   load = workload( k, j )
                      ,   completed = 0
                      ,   total = 0
                      ,   done = false

                      ;

                      function state () {
                          return {
                                load: load
                              , completed: completed
                              , total: total
                              , done: done
                          };
                      }

                      function traverse () {
                          var c, p;

                          while ( ! done ) {
                              if ( p_iterator !== undefined ) {
                                  while ( true ) {
                                      check();
                                      if ( ( p = p_iterator.next() ) === null ) break;

                                      // console.log( '        ' + arrrepr( p ) );
                                      total += to_prob( p );
                                      completed++;
                                  }
                              }

                              if ( ( c = c_iterator.next() ) == null ) {
                                  done = true;
                                  break;
                              }

                              // console.log( arrrepr( c ) );
                              p_iterator = CORE.permutations_iterator( c );
                          }
                      }

                      traverse.traverse = traverse;
                      traverse.state = state;
                      return traverse;
                  }  // function mk_combinations_traversal ( matrix, alarm ) {

                  return ( function () {

                      var _
                      ,   start_time

                      ,   status = 'PENDING'

                      ,   workfor = 100
                      ,   waitfor = 0
                      ,   alarm

                      ,   traverse
                      ,   finish
                      ;

                      function start () {

                          var _
                          ,   sequences
                          ,   args
                          ,   matrix
                          ,   probability_vectors
                          ,   null_prob
                          ,   result = undefined
                          ;

                          start_time = Date.now();

                          fraction_complete = 0;
                          time_estimate = null;
                          busy();

                          cancel_calculation = 0;

                          sequences = [ input.S, input.P ].map( function ( ss ) {
                              return ss.map( function ( s ) { return s[ 0 ]; } );
                          } );

                          if ( 0 < sequences.filter( function ( s ) {
                                                  return s === undefined || s.length == 0;
                                              } )

                                            .length ) {
                              return;
                          }

                          args = sequences.concat( [ DATA.FEATURE2BETA ] );

                          matrix = CORE.calculate_pairwise.apply( null, args )

                          if ( matrix === undefined ||
                               matrix.length == 0 ||
                               matrix[ 0 ].length == 0 ) {

                              return;
                          }

                          result = {
                              pairwise: matrix,
                              overall: undefined
                          };

                          probability_vectors = matrix.map( function ( row ) {
                              return row.map( function ( p ) { return 1 - p } );
                          } );

                          null_prob = ravelprod( probability_vectors );

                          alarm = mk_alarm( workfor );
                          traverse = mk_combinations_traversal( probability_vectors, alarm );

                          finish = function ( total ) {
                              if ( total !== null ) {
                                  result.overall = 1 - null_prob / total;
                              }

                              output = result;
                              output_changed();
                          };

                          // PROGRESS.init( { interval: 100 } );

                          // $( '#calculate' ).css( 'display', 'none' );
                          // $( '#jq-progressbar' ).css( 'display', 'inline-block' );

                          continuation();
                      }  // function start () {

                      function continuation () {

                          var _
                          ,   elapsed_time
                          ,   state
                          ;

                          status = 'IN_PROGRESS';

                          alarm.init();
                          try {
                              traverse();
                          }
                          catch ( e ) {
                              if ( e.message !== 'interrupt calculation' ) throw e;
                              if ( e.name === 'reset' ) status = 'RESET';
                              else if ( e.name === 'cancel job' ) status = 'CANCELLED';
                          }
                          finally {
                              alarm.off();
                          }

                          state = traverse.state();

                          if ( state.done ) status = 'DONE';

                          if ( status === 'DONE' ) {
                              assert( state.completed === state.load );

                              // var tt = Date.now() - start_time;
                              // console.log( 'total time: ' + tt + 'ms' );
                              // console.log( format_time( tt, 3 ) );

                              fraction_complete = 1;
                              time_estimate = 0;

                              finish( state.total );
                          }
                          else if ( status === 'CANCELLED' ) {
                              finish( null );
                          }
                          else if ( status === 'RESET' ) {}
                          else {

                              fraction_complete = state.completed / state.load;
                              elapsed_time = Date.now() - start_time;
                              time_estimate = ( ( 1 - fraction_complete ) / fraction_complete ) * elapsed_time;

                              // console.log( ( elapsed_time + time_estimate ) + ' ( = ' +
                              //              elapsed_time + ' + ' +
                              //              time_estimate + ' )' );

                              busy();
                              setTimeout( continuation, waitfor );
                          }
                      }  // function continuation () {

                      return start;

                  } )();  // return ( function () {

            } )()  // , calculate: ( function () {

            , reset: function () {
                cancel_calculation = -1;
                for ( var type in raw_input ) { raw_input[ type ] = []; }
                for ( var type in     input ) {     input[ type ] = []; }
                state_reset();
            }  // , reset: function () {

            , nixall: function ( type ) {
                input[ type ] = [];
                raw_input[ type ] = [];
                input_changed( type );
            }  // , nixall: function ( type ) {

            , nix: function ( type, i ) {
                input[ type ].splice( i, 1 );
                raw_input[ type ].splice( i, 1 );
                input_changed( type );
            }  // , nix: function ( type, i ) {

            , add_sequences: function ( type, sequences ) {
                var ss = sequences.map( function ( s ) { return [ s, false ] } );

                input[ type ] = input[ type ].concat( ss );
                raw_input[ type ] = raw_input[ type ].concat( sequences );

                input_changed( type );
            }  // , add_sequences: function ( type, sequences ) {

            , update: function ( type, index, value ) {
                assert( raw_input[ type ][ index ] === value );

                var seq = normalize_input_sequence( value, type );

                input[ type ][ index ] =
                    [ seq, seq.toUpperCase() != value.toUpperCase() ];

                input_changed( type );
            }  // , update: function ( type, index, value ) {

            , update_raw: function ( type, index, value ) {
                raw_input[ type ][ index ] = value;
                raw_input_changed( type );
            }  // , update_raw: function ( type, index, value ) {

        };  // STATE = {

        [
            'state_reset'
          , 'raw_input_changed'
          , 'input_changed'
          , 'output_changed'
          , 'busy'

        ].forEach( function ( type ) {
            signal_types[ type ] = $.make_signal_type();
        } );

    } )();  // scope: define STATE

    // --------------------------------------------------------------

    ( function () { // scope: wire up controls

        $( '#test' ).click( function () { console.log( Date.now() ); } );

        $( '#example' ).click( STATE.example );

        $( '#calculate' ).click( STATE.calculate );

        $( '#progress-indicator' ).click( function () {
            STATE.cancel();
            $( this ).hide();
        } );

        $( '#reset' ).click( STATE.reset );

        $( '.add' ).click( function ( e ) {
            var _
            ,   $seq_div = $( this ).closest( '.input-panel' )
                                    .find( '.sequences-div' )
            ,   input_changed = STATE.signal_types.input_changed
            ,   type = get_type( e.target )
            ;

            $seq_div.on_signal( input_changed,
                                function () {
                                    $seq_div.off_signal( input_changed )
                                            .find( 'textarea' )
                                            .last()
                                            .focus();
                                } )

            STATE.add_sequences( type, [ '' ] );
        } );

        $( '.nixall' ).click( function ( e ) {
            STATE.nixall( get_type( e.target ) );
        } );

        $( '.pull-down' )
            .click( function () {
                $( this ).find( 'input' )
                         .val( '' )
                         .css( 'font-style', 'normal' );
            } )
        ;

        function _keydown ( e ) {
            var _
            ,   code = e.keyCode
            ,   $this = $( this )
            ;

            if ( code == 9 || code == 13 ) {

                var _
                ,   choices = $this.autocomplete( 'widget' )
                                   .find( 'li.ui-menu-item' )
                ,   n = choices.length
                ,   visible = choices.parent()
                                     .css( 'display' ) !== 'none'
                ;

                if ( n > 0 && visible ) {
                    if ( n == 1 ) {
                        choices.trigger( 'click' );
                    }
                }
                else if ( code == 9 && e.shiftKey ) {
                    var focus_target =
                            '#' + ( e.target.id ==
                                    'sh2-protein' ? 'phospho-protein'
                                                  : 'sh2-protein' );

                    $( focus_target ).focus()
                                     .val( '' );

                    $this.val( '' );
                }

                return false;
            }
        }

        $( '.pull-down input' )
            .keydown( _keydown )
            .autocomplete( {
                  select: function ( event, ui ) {
                              event.preventDefault();

                              var _
                              ,   type = get_type( this )
                              ,   gene_id = ui.item.value
                              ,   sequences = LKP[ type ][ gene_id ]
                              ;

                              STATE.add_sequences( type, sequences );

                              // http://stackoverflow.com/a/2561919
                              $( this ).val( '' );
                          } // select: function ( event, ui ) {
            } )
        ;

        function get_index ( elt ) {
            var i = -1
            ,   classname = 'sequence'
            ,   seq
            ;

            if ( elt.classList.contains( classname ) ) {
                seq = elt;
            }
            else {
                seq = $( elt ).closest( '.' + classname ).get( 0 );

            }

            $( seq ).closest( '.sequences-div' )
                    .find( '.sequence' )
                    .each( function ( j ) {
                        if ( this === seq ) {
                            i = j;
                            return false;
                        }
                    } );

            return i;
        }

        function _new_input ( evt ) {
            var tgt = evt.target;
            return [ get_type( tgt ), get_index( tgt ), tgt.value ];
        }

        function _change ( evt ) {
            STATE.update.apply( STATE, _new_input( evt ) );
        }

        var _typing = ( function () {
            var _
            ,   typing_timer
            ,   typing_interval = 50
            ;

            function _call_update_raw ( evt ) {
                typing_timer = undefined;
                STATE.update_raw.apply( STATE, _new_input( evt ) );
            }

            return function ( evt ) {
                if ( typing_timer !== undefined ) {
                    clearTimeout( typing_timer );
                }
                typing_timer = setTimeout(
                    _call_update_raw.bind( this, evt ),
                    typing_interval
                );
            }
        } )();

        $( '.sequences-div' )
            .click( function ( evt ) {
                var $tgt = $( evt.target );
                if ( ! $tgt.hasClass( 'closebox' ) ) { return }

                var _
                ,   nix = $tgt.closest( '.sequence' ).get( 0 )
                ,   type = get_type( nix )
                ,   i = get_index( nix )
                ;

                STATE.nix( type, i );
            } )
            .on( 'input', _typing )
            .keyup( _typing )
            .change( _change )
        ;

    } )();  // scope: wire up controls

    // --------------------------------------------------------------

    ( function () { // scope: wire up views
        var _
        ,   state_reset = STATE.signal_types.state_reset
        ,   input_changed = STATE.signal_types.input_changed
        ,   raw_input_changed = STATE.signal_types.raw_input_changed
        ,   busy = STATE.signal_types.busy
        ,   output_changed = STATE.signal_types.output_changed
        ;

        // ----------------------------------------------------------

        function _clear_results () {
            UI.cy.elements().remove();
            // TODO: UNCOMMENT NEXT LINE
            // $( '#overall-box' ).hide();
            $( '#overall' ).html( '&nbsp;' );
        }

        function _sequence_class ( type ) {
            return type == 'S' ? 'sh2-domain' : 'phospho-site';
        }

        function _make_sequence_div( sequence, type ) {
            var rows = type == 'S' ? 7 : 1,
                cls = _sequence_class( type );
            return $(  '<div class="sequence-wrapper">' +

                       '<div class="sequence ' + cls + ' ui-input">' +
                           '<div class="closebox ui-input"' +
                           ' title="remove"></div>'   +
                           '<textarea rows="' + rows + '">' +
                               sequence                     +
                           '</textarea>'                    +
                       '</div>'
                       + '</div>'
                   );
        }

        function _sequences_div ( type ) {
            var cls = _sequence_class( type );
            return $( '#selected-' + cls + 's' );
        }

        function _add_sequence ( sequence, type ) {
            var d = _make_sequence_div( sequence, type );

            var parent = ( function () {
                var cls = _sequence_class( type );
                return $( '#selected-' + cls + 's' );
            } )();

            parent.append( d );

            return d;
        }

        function _update_input ( input, type ) {
            var _
            ,   sequences = input[ type ]
            ,   sdiv = _sequences_div( type )
            ,   sel = '.sequence textarea'

            ,   m = sdiv.find( sel ).length
            ,   n = sequences.length
            ;

            while ( m < n ) {
                _add_sequence( '', type );
                m++;
            }

            var slots = sdiv.find( sel );

            sequences.forEach( function ( sequence, index ) {
                slots.eq( index ).val( sequence[ 0 ] )
                                 .parent()
                                 .toggleClass( 'normalized', sequence[ 1 ] )
                ;
            } );

            while ( n < m ) {
                slots.eq( n++ ).parent().remove();
            }
        }

        $( '#three-columns-panel' ).on_signal( input_changed, _update_input )
                                   .on_signal( state_reset,
                                               function () {
                                                   $( this ).find( '.sequence' )
                                                            .remove();
                                               } )
        ;

        // ----------------------------------------------------------

        function have_some_input ( input ) {
            for ( var type in input ) {
                if ( input[ type ].length > 0 ) { return true; }
            }
            return false;
        }

        function input_size ( input ) {
            return input.filter( function ( s ) { return s.match( /\S/ ); } )
                        .length;
        }

        function have_full_input ( raw_input ) {
            for ( var type in raw_input ) {
                if ( input_size( raw_input[ type ] ) == 0 ) {
                    return false;
                }
            }
            return true;
        }

        function _enable  () { $( this ).attr( 'disabled', false ) }

        function _disable () { $( this ).attr( 'disabled', true  ) }

        // ----------------------------------------------------------

        $( '.pull-down' )
            .on_signal( state_reset, function () {
                $( this ).find( 'input' )
                         .val( this.title )
                         .css( 'font-style', 'italic' );
            } )
            .on_signal( input_changed, function ( input, type ) {
                if ( type === get_type( this ) ) {
                    $( this ).trigger( 'click' );
                }
            } )
        ;

        $( '#example' )
            .on_signal( state_reset, _enable )
            .on_signal( input_changed,
                        function ( input ) {
                            $( this ).attr( 'disabled',
                                            have_some_input( input ) );
                        } )
        ;

        $( '#calculate' )
            .on_signal( state_reset, _disable )
            .on_signal( output_changed, _disable )
            .on_signal( raw_input_changed, function ( raw_input ) {
                $( this ).attr( 'disabled', ! have_full_input( raw_input ) );
            } )
            .on_signal( busy, _disable )
        ;

        $( '#progress-indicator' )
            .on_signal( state_reset, function () {
                $( this ).hide();
            } )
            .on_signal( output_changed, function () {
                $( this ).hide();
            } )
            .on_signal( busy, function () {
                $( this ).show();
            } )
        ;

        $( '#progressbar' )
            .on_signal( busy, function ( fraction_complete ) {
                var _
                ,   $this = $( this )
                ,   isvisible = $this.is( ':visible' )
                ;

                if ( ! isvisible ) {
                    if ( fraction_complete < 0.5 ) {
                        $this.show();
                        isvisible = true;
                    }
                }
            } )
        ;

        $( '#time-remaining' )
            .on_signal( busy, function ( _, time_estimate ) {
                $( this ).html( 'time remaining: ' +
                                format_time( time_estimate ) );
            } )
        ;

        $( '#progressbar .value' )
            .on_signal( state_reset, function () {
                $( this ).css( 'width', '0%' );
            } )
            .on_signal( output_changed, function () {
                $( this ).css( 'width', '100%' );
            } )
            .on_signal( busy, function ( fraction_complete ) {
                var pct = Math.round( 100 * fraction_complete );
                $( this ).css( 'width', pct + '%' );
            } )
        ;

        $( '#input-blocker' )
            .on_signal( state_reset, function () { $( this ).hide(); } )
            .on_signal( output_changed, function () { $( this ).hide(); } )
            .on_signal( busy, function () { $( this ).show(); } )
        ;

        $( '#overall-box' )
            .on_signal( state_reset, function () {
                $( this ).css( 'visibility', 'hidden' );
            } )
            .on_signal( output_changed, function ( output ) {
                $( this ).css( 'visibility', 'visible' );
            } )
        ;

        $( '#overall' )
            .on_signal( output_changed, function ( output ) {
                $( this ).text( Math.round( output.overall * 100 ) + '%' );
            } )
        ;

        $( '#overall-box' ).on_signal( state_reset, function () {
            $( this ).css( 'visibility', 'hidden' );
        } );

        $( '#no-edges' )
            .on_signal( state_reset, function () {
                $( this ).css( 'visibility', 'hidden' )
            } )
            .on_signal( output_changed, function ( output ) {
                var _
                ,   vals =
                    output.pairwise.reduce( function( a, b ) {
                        return a.concat( b );
                    }, [] )
                ,   max = Math.max.apply( null, vals )
                ;
                $( this ).css( 'visibility',
                               max < MIN_EDGE_WEIGHT ? 'visible' : 'hidden' );
            } )
        ;

        $( '#graph-panel' )
            .on_signal( state_reset, _clear_results )
            .on_signal( output_changed, function ( prob ) {
                var WIDTH = $( '#graph-div' ).width();

                var LEFT_EDGE = 0;
                var RIGHT_EDGE = WIDTH;

                var PAN = UI.pan;
                var cy = UI.cy;

                function _add( ele ) {
                    cy.add( ele );
                    return cy.$( '#' + ele.data.id );
                }

                var add_node = ( function () { // closure

                    var serial = 0;

                    return function ( lr, y, pfx ) {
                        var node = _add( {
                            group: 'nodes',
                            position: {
                                  x: lr == 0 ? LEFT_EDGE : RIGHT_EDGE
                                , y: y
                            },
                            data: {
                                  id: serial + ''
                                , type: pfx
                            }
                        } );

                        serial += 1;

                        (
                            function () { // (scope)

                                // increase height of #graph-div, if necessary

                                var nh2 = Math.ceil( node.height()/2 ),

                                    max_height = PAN.y + y + nh2,

                                    slack =   PAN.y
                                            + Math.min.apply( null,
                                                              cy.$( 'node' ).map( function ( e ) {
                                                                  return   e.renderedPosition().y
                                                              } ) )
                                            - nh2,

                                    required_height = max_height + slack;

                                if ( required_height > $( '#graph-div' ).height() ) {
                                    $( '#graph-div' ).height( required_height );
                                }
                            }

                        )();

                        return node;
                    };

                } )();  // var add_node = ( function () { // closure

                function add_nodes ( $nodes, lr ) {
                    var $graph_div = $( '#graph-div' );

                    var gdy = parseInt( $graph_div.position().top );

                    add_nodes = function ( $nodes, lr ) {
                        var prefix = lr == 0 ? 'sh2' : 'pho';

                        return $nodes.map( function ( i, e ) {
                            var $e = $( e );
                            var y = $e.position().top +
                                    parseInt( $e.css( 'margin-top' ) ) +
                                    Math.floor( $e.outerHeight()/2 ) -
                                    gdy;
                            return add_node( lr, y, prefix );
                        } );
                    };
                    return add_nodes.apply( this, arguments )
                }

                function add_edge ( source, target, weight ) {
                    return _add( {
                        group: 'edges',
                        data: {
                              source: source
                            , target: target
                            , id: source + '---' + target
                            , weight: weight
                            , visible: weight >= MIN_EDGE_WEIGHT
                        },
                        css: {
                            width: Math.round( weight * 10 )
                        }
                    } );
                }

                // add nodes to graph
                var sh2_nodes = add_nodes( $( '.sh2-domain' ), 0 );
                var pho_nodes = add_nodes( $( '.phospho-site' ), 1 );

                // add edges to graph
                var matrix = prob.pairwise;
                $.each( sh2_nodes, function ( i, sh2_node ) {
                    $.each( pho_nodes, function ( j, pho_node ) {
                        add_edge( sh2_node.id(), pho_node.id(), matrix[ i ][ j ] );
                    } );
                } );

                cy.resize();

                function fmt_wt ( weight ) {
                    return '' + ( Math.round( 1000 * weight )/1000 );
                }

                function get_wt ( e ) {
                    return fmt_wt( e.data().weight );
                }

                function html_table ( rows ) {
                    function html_row ( cells ) {
                        function html_cell ( val ) {
                            return '<td>' + val + '</td>';
                        }
                        var val = cells.map( html_cell ).join( '' );
                        return '<tr>' + val + '</tr>';
                    }
                    var val = rows.map( html_row ).join( '' );
                    return '<table><tbody>' + val + '</tbody></table>';
                }

                cy.edges( '[?visible]' )

                  .on( 'mouseover',
                        POPUP.make_mousedown_callback( function ( ev ) {
                            var edge = ev.cyTarget;
                            edge.addClass( 'hover' );
                            return html_table( [ [ get_wt( edge ) ] ] );
                        } ) )

                  .on( 'mouseout', function ( e ) {
                      e.cyTarget.removeClass( 'hover' );
                      POPUP.remove_popup( e );
                  } );

            } )
            .on_signal( input_changed, _clear_results )
            .on_signal( raw_input_changed, _clear_results )

        $( '#reset' ).on_signal( state_reset, _disable )
                     .on_signal( input_changed,
                                 function ( input ) {
                                     var no_input = true;
                                     for ( var type in input ) {
                                         if ( input[ type ].length > 0 ) {
                                             no_input = false;
                                             break;
                                         }
                                     }

                                     $( this ).attr( 'disabled', no_input );
                                 } );

        $( '.nixall' ).on_signal( state_reset, _disable )
                      .on_signal( input_changed,
                                  function ( input, type ) {
                                      if ( get_type( this ) != type ) { return; }
                                      var ss = input[ type ];
                                      $( this ).attr( 'disabled', ss.length == 0 );
                                  } );

    } )();  // scope: wire up views

    // --------------------------------------------------------------

    UI = {

          '': null  // sentinel

        , init: function () {

            $( '.hidden' ).removeClass( 'hidden' );

            UI.init_pulldowns();

            UI.init_graph();

            POPUP.init();

            UI.adjust_css();

            UI.init_progressbar();

            $( '#input-blocker' ).hide();

        }  // , init: function ( data ) {

        , init_pulldowns: function () {

            function _open ( e, o ) {
                var _
                ,   $this = $( this )
                ,   $win = $( window )
                ,   $wid = $this.autocomplete( 'widget' )
                ,   fn = function ( e, o ) {
                        var _
                        ,   margin_bottom = 20
                        ,   b = $win.scrollTop() + $win.height()
                        ,   h = Math.floor( b - $wid.offset().top - margin_bottom )
                        ;

                        $wid.css( 'max-height', 'none' );
                        if ( h < $wid.outerHeight() ) {
                            $wid.css( { 'max-height': h,
                                        'overflow-y': 'scroll' } );
                        }
                        else {
                            // hide scrollbar when not needed
                            $wid.css( { 'overflow-y': 'visible' } );
                        }

                        // For some reason, the phospho menu starts out being
                        // out of alignment relative to the input field; the
                        // next line fixes this, as well as any other similar
                        // misalignments that may arise.

                        $wid.offset( { top: $wid.offset().top,
                                       left: $this.offset().left } );
                    }
                ;
                $( this ).autocomplete( { open: fn } );
                return fn.apply( this, arguments );
            }  // function _open ( e, o ) {

            function _make_callback ( lookup ) {
                var choices = Object.keys( lookup ).sort();

                function _make_regex ( str ) {
                    return new RegExp( '^' + $.ui
                                              .autocomplete
                                              .escapeRegex( str ),
                                       'i' );
                }

                return function ( req, response_fn ) {
                    var re = _make_regex( req.term );

                    var completions =
                        $.grep(
                            choices,
                            function ( choice ) {
                                return re.test( choice );
                            }
                        );

                    response_fn( completions );
                }
            }  // function _make_callback ( lookup ) {

            var _
            ,   $ac = $( '.input-panel input' )
            ,   $s = $( '.sequence' )
            ,   w = Math.max.apply( null, $s.map( function () {
                    return $( this ).outerWidth();
                } ) )
            ,   $r = $( '#results-box' )
            ;

            $ac.each( function () {
                    var type = get_type( this );
                    $( this ).autocomplete( {
                          source: _make_callback( LKP[ type ] )
                        , open: _open
                    } )
                } )
                .outerWidth( w );

            $r.outerHeight( $s.eq( 0 ).offset().top - $r.offset().top );

            $s.remove();

        }  // , init_pulldowns: function () {

        , init_graph: function () {

            var PAN = UI.pan = {
                x: 0,
                y: -parseInt( $( '#graph-panel > div' ).css( 'padding-top' ) )
            };

            var $graph_div = $( '#graph-div' );

            // var hover_color = POPUP.get_popup_color();
            var hover_color = '#888';
            var cy = UI.cy = cytoscape( {

              container: $graph_div[ 0 ],

              minZoom: 1,
              maxZoom: 1,
              zoomingEnabled: false,
              userZoomingEnabled: false,
              panningEnabled: true,
              userPanningEnabled: false,
              boxSelectionEnabled: false,
              autolock: true,
              autoungrabify: true,
              autounselectify: true,

              layout: {
                name: 'preset',
                fit: false,
                zoom: 1,
                pan: PAN
              },

              style: [
                  {
                      selector: 'node',
                      css: {
                          width: 10,
                          height: 10
                      }
                  },
                  {
                      selector: 'node[type="sh2"]',
                      css: {
                          'background-color': 'rgb(234, 21, 122)' // red
                      }
                  },
                  {
                      selector: 'node[type="pho"]',
                      css: {
                          'background-color': 'rgb(0, 126, 234)' // blue
                      }
                  },
                  {
                      selector: 'edge',
                      css: {
                            'target-arrow-shape': 'triangle'
                          , 'z-index': 1000
                      }
                  },
                  {
                      selector: 'edge[!visible]',
                      css: { display: 'none' }
                  },
                  {
                      selector: 'edge.hover',
                      css: {
                            'line-color': hover_color
                          , 'target-arrow-color': hover_color
                          , 'z-index': 2000
                      }
                  }
              ],

            } ); // var cy = UI.cy = cytoscape( {

            cy.add( { group:'nodes', renderedPosition: { x:0, y:100000 } } );

        }  // , init_graph: function () {

        , init_progressbar: function () {

            var _
            ,   tb = [ 'top', 'bottom' ]
            ,   rl = [ 'right', 'left' ]
            ;

            function copy_border ( $from, $to ) {
                tb.concat( rl ).forEach( function ( s ) {
                    var prop = [ 'border', s, 'width' ].join( '-' );
                    $to.css( prop, $from.css( prop ) );
                } );

                tb.forEach( function ( v ) {
                    rl.forEach( function ( h ) {
                        var prop = [ 'border', v, h, 'radius' ].join( '-' );
                        $to.css( prop, $from.css( prop ) );
                    } );
                } );
            }

            var _
            ,   $calc = $( '#calculate' )
            ,   $prog = $( '#progressbar' )
            ,   $time = $( '#time-remaining' )
            ;

            $( '#progress-indicator' ).hide();
            $( '#time-remaining' ).hide();

            copy_border( $calc, $prog );

            $prog.outerWidth ( $calc.outerWidth()  )
                 .outerHeight( $calc.outerHeight() )
            ;

            ( function () {
                var _
                ,   ready = {}
                ,   disabled = {}
                ,   timer = disabled
                ;

                $( '#calculate' ).mouseenter( function () {
                    timer = disabled;
                } );

                $prog.hover(
                    function () {
                        if ( timer === disabled ) { return; }
                        if ( timer !== ready ) { clearTimeout( timer ); }
                        timer = setTimeout( function () { $time.show(); }, 400 );
                    },
                    function () {
                        $time.hide();
                        if ( timer !== ready ) {
                            if ( timer === disabled ) {
                                timer = ready;
                            }
                            else {
                                clearTimeout( timer );
                            }
                        }
                    }
                );

            } )();

        }  // , init_progressbar: function () {

        , adjust_css: function () {

            ( function () {  // scope

                // heroic efforts required to undo the effects of reset.css

                var _
                ,   $app_buttons = $( '#app-root button' )
                ,   $iframe = $( '<iframe></iframe>' ).appendTo( 'body' )
                ,   $original_button =
                        ( $( '<button></button>' )
                          .appendTo( $iframe.contents().find( 'body' ) ) )
                ;

                $app_buttons.css( 'padding',
                                  $original_button.css( 'padding' ) )

                            .not( '.control-panel *, .info' )
                            .css( 'margin',
                                  $original_button.css( 'margin' ) )
                ;

                $iframe.remove();

            } )();

        }

    };  // UI = {

    // --------------------------------------------------------------

    POPUP = {

          '': null  // sentinel

        , init: function () {
            $( window ).bind( {
                mousedown: POPUP.remove_popup,
                resize: POPUP.remove_popup,
                scroll: POPUP.remove_popup,
            } );

            $( '#graph-div' ).bind( {
                mouseleave: POPUP.remove_popup
            } );
        }

        , get_popup_color: function () {
            var $p = $( '<div id="popup" style="visibility: hidden"></div>' )
                     .appendTo( 'body' );
            var color = $p.css( 'background-color' );
            $p.remove();
            return color;
        }

        , get_popup_margins: function ( $popup ) {
              function pxtoint( s ) {
                  return parseInt( s.replace( /px\s*$/i, '' ) );
              }

              var margins = { t: pxtoint( $popup.css( 'margin-top' ) ),
                              r: pxtoint( $popup.css( 'margin-right' ) ),
                              b: pxtoint( $popup.css( 'margin-bottom' ) ),
                              l: pxtoint( $popup.css( 'margin-left' ) ) };

              // NB: function redefines itself as a closure, with
              // memoized return value
              POPUP.get_popup_margins = function ( _ ) { return margins; }
              return margins;
          }

        , get_popup_lr_offset: function ( $popup ) {
              // returns x- and y-offsets of popup's lower-right corner
              // (relative to popup's position)
              var margins = POPUP.get_popup_margins( $popup );
              var slack = 1;
              var dx = margins.r + slack;
              var dy = margins.b + slack;

              // function redefines itself as a closure
              var fn = POPUP.get_popup_lr_offset = function ( $p ) {
                  return { x: $p.outerWidth() + dx, y: $p.outerHeight() + dy };
              }

              return fn( $popup );
          }

        , get_popup: function ( content ) {
              return ( content === null ) ? null
                                          : $( '<div id="popup">' + content +
                                               '</div>' ).appendTo( 'body' );
          }

        , make_mousedown_callback: function ( get_popup_content ) {
              var CURSORWIDTH = 12;

              function mousedown_callback ( cye ) {

                  cye.stopPropagation();
                  POPUP.remove_popup( cye );

                  var $popup = POPUP.get_popup( get_popup_content( cye ) );
                  if ( $popup === null ) return;

                  var e = cye.originalEvent;

                  // x0 and y0 give the preferred offset for the popup,
                  // barring conflicts with the current viewport's edges
                  var x0 = e.pageX + CURSORWIDTH;
                  var y0 = e.pageY;

                  var lr_offset = POPUP.get_popup_lr_offset( $popup );
                  var margins = POPUP.get_popup_margins( $popup );

                  var $win = $( window );

                  // l, r, t, and b give the x- (l, r) or y-coordinates (t,
                  // b) for of the current viewport's left, right, top, and
                  // bottom edges, respectively
                  var l = $win.scrollLeft();
                  var r = l + $win.width();
                  var t = $win.scrollTop();
                  var b = t + $win.height();

                  // xl and xr give the x-offsets that would put the popup
                  // up against the viewport's left and right edges,
                  // respectively
                  var xl = l + margins.l;
                  var xr = r - lr_offset.x;

                  // yt and yb give the y-offsets that would put the popup
                  // up against the viewport's top and bottom edges,
                  // respectively
                  var yt = t + margins.t;
                  var yb = b - lr_offset.y;

                  // the expression below implements the following policy
                  // (for the horizontal and vertical dimensions considered
                  // separately):
                  // - if the viewport is not wide|tall enough to fully
                  //   contain the popup, position the popup against the
                  //   viewport's left|top edge;
                  // - otherwise, if positioning the popup at x0|y0 would
                  //   cause it to extend beyond the viewport's right|bottom
                  //   edge, then position it against the viewport's
                  //   right|bottom edge instead;
                  // - otherwise, position the popup at x0|y0.
                  var offset = { left: Math.max( xl, Math.min( xr, x0 ) ),
                                 top:  Math.max( yt, Math.min( yb, y0 ) ) };

                  $popup.offset( offset );
              }

              return mousedown_callback;
          }

        , remove_popup: function ( e ) {
              e.stopPropagation();
              $( '#popup' ).remove();
          }
    };  // POPUP = {

    // --------------------------------------------------------------

    APP = {

          '': null  // sentinel

        , init: function ( data, _, __ ) {

            DATA = data;
            LKP = { S: DATA.SH2, P: DATA.PHO };

            UI.init();

            STATE.reset();
            STATE.example();
            // STATE.calculate();

        }
    };  // APP = {

  } )();  // ( function () {

  return function () {
      $.get(
             window.__STATIC_URL__ + 'data/interaction-probabilities-viewer/data.json',
             APP.init,
             'json'
           );
  };

} // function ( $      ,  _        ,  cytoscape/*      ,  d3 ,  cfg      ,  c        ,  adjust_css   ,  add_pickers   ,  load_plots   ,  events*/ ) {

);
