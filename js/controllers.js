angular.module('starter.controllers', ['ngRoute'])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout, $ionicPopup, $ionicLoading, $routeParams) {
        // database name
        const dbName = 'geoDiary';
        const dbTable = 'diary';

        // db reference
        $scope.db;

        // map references
        $scope.map;
        $scope.mapMarker;
        $scope.currentPosition;

        /* CREATE INDEXEDDB */
        //console.log('Application Loaded!');

        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

        // Open Database
        var request = window.indexedDB.open(dbName, 4);

        // Any error opening Database
        request.onerror = function(event) {
            //console.log('Error opening database :(');
            $scope.openErrorPopup('Please restart the app and try again. If the problem still exists please contact us. Submit your error report to <a href="mailto:kvkrusl@gmail.com">mailto:kvkrusl@gmail.com</a>\nWe are sorry for the inconvenience caused.');
        };

        request.onsuccess = function(event) {
            //console.log('Database opened successfully!');
            $scope.db = request.result;
        };

        request.onupgradeneeded = function(event) {
            var db = event.target.result;

            db.onerror = function(event) {
                //console.log('Error loading database :(');
                $scope.openErrorPopup('Please restart the app and try again. If the problem still exists please contact us. Submit your error report to <a href="mailto:kvkrusl@gmail.com">mailto:kvkrusl@gmail.com</a>\nWe are sorry for the inconvenience caused.');
            };

            // Create the objectStore
            var objectStore = db.createObjectStore(dbTable, { keyPath: 'ID' });

            // Data items objectStore retains
            objectStore.createIndex('Lat', 'Lat', { unique: false });
            objectStore.createIndex('Lon', 'Lon', { unique: false });
            objectStore.createIndex('Title', 'Title', { unique: false });
            objectStore.createIndex('Description', 'Description', { unique: false });
            objectStore.createIndex('Timestamp', 'Timestamp', { unique: false });

            //console.log('ObjectStore created successfully!');
        };

        /* SAVE GEOLOCATION TO DATABASE */

        $scope.saveToDB = function() {
            //e.preventDefault();
            var ID = new Date().getTime();
            var title = $scope.saveData.title;
            var description = $scope.saveData.description;
            var latitude = $scope.currentPosition.coords.latitude.toFixed(5);
            var longitude = $scope.currentPosition.coords.longitude.toFixed(5);
            var currentdate = new Date();
            var timestamp = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

            // debug
            //console.log(ID);
            //console.log(title);
            //console.log(description);
            //console.log(latitude);
            //console.log(longitude);
            //console.log(timestamp);

            var newRecord = [
                { ID: ID, Lat: latitude, Lon: longitude, Title: title, Description: description, Timestamp: timestamp}
            ];

            // debug
            //console.log(newRecord);

            var transaction = $scope.db.transaction([dbTable], 'readwrite');

            transaction.oncomplete = function(event) {
                // Debug message
                //console.log('Transaction opened for adding items!');
            };

            transaction.onerror = function(event) {
                // Debug message
                //console.log('Transaction not opened due to error :(');
                $scope.openErrorPopup('Please restart the app and try again. If the problem still exists please contact us. Submit your error report to <a href="mailto:kvkrusl@gmail.com">mailto:kvkrusl@gmail.com</a>\nWe are sorry for the inconvenience caused.');
            };

            // get a reference to the objectStore that has already been added.
            var objectStore = transaction.objectStore(dbTable);
            // Add item to the objectStore
            var request = objectStore.add(newRecord[0]);

            request.onsuccess = function(event) {
                // Debug message
                //console.log('New record added successfully!');

                ID = null;
                title = null;
                description = null;
                latitude = null;
                longitude = null;
                currentdate = null;
                timestamp = null;

                //showData();
            };

            request.onerror = function(event) {
                // Debug message
                //console.log('Data was not added :(');
                $scope.openErrorPopup('Please restart the app and try again. If the problem still exists please contact us. Submit your error report to <a href="mailto:kvkrusl@gmail.com">mailto:kvkrusl@gmail.com</a>\nWe are sorry for the inconvenience caused.');
            };
        };

        /* GET GEOLOCATION DATA FROM DATABASE */
        $scope.getDataFromDB = function() {
            $scope.locationList = [];
            //console.log('Inside Show Data Function');

            var objectStore = $scope.db.transaction(dbTable).objectStore(dbTable);
            objectStore.openCursor().onsuccess = function(event) {
                var cursor = event.target.result;

                if(cursor) {

                    $scope.locationList.push(cursor.value);
                    //console.log(cursor.value);
                    //console.log(cursor.value.ID);
                    cursor.continue();
                }


                //console.log($scope.locationList);
                $scope.$broadcast('scroll.refreshComplete');
            };
        };

        //$scope.page = {};
        //$scope.$watch(function(){
        //    return window.innerHeight;
        //}, function(value) {
        //    console.log(((value / 100) * 75));
        //    $scope.page.height = ((value / 100) * 75);
        //
        //});


        /* GET A SINGLE RECORD BY ID & SHOW ON MAP */
        $scope.getLocationByID = function(item) {
            //console.log('In diaplayObject ()');
            $scope.selectedItem = item;
            $scope.map = {
                center: {
                    latitude: item.Lat,
                    longitude: item.Lon
                },
                zoom: 15
            };
            $scope.options = {
                scrollwheel: false,
                panControl: false,
                rotateControl: false,
                scaleControl: false,
                streetViewControl: false
            };

            $scope.marker = {
                id: 0,
                coords: {
                    latitude: item.Lat,
                    longitude: item.Lon
                },
                options: {
                    draggable: false
                }
            };
        };



        /* SAVE POPUP */
        $scope.openSavePopup = function() {
            $scope.saveData = {};

            var savePopup = $ionicPopup.show({
                template: '<input type="text" class="custom-input" placeholder="Title (Required)" ng-model="saveData.title"><br /><textarea class="custom-input" placeholder="Description (Optional)" rows="6" cols="5" ng-model="saveData.description"></textarea>',
                title: '<h3 class="about-text-header">Save Location</h3>',
                subTitle: 'Save your location with a title and a description.You <b>MUST</b> provide a title.',
                scope: $scope,
                buttons: [
                    {
                        text: 'Cancel',
                        onTap: function(e) {
                            savePopup.close();
                        }
                    },
                    {
                        text: 'Save',
                        type: 'button-balanced',
                        onTap: function(e) {
                            if(!$scope.saveData.title) {
                                e.preventDefault();
                            } else {
                                if(!$scope.saveData.description) {
                                    $scope.saveData.description = '';
                                }
                                $scope.saveToDB();
                                //return $scope.saveData;
                            }
                        }
                    }
                ]
            });

            savePopup.then(function(res) {
                //console.log('Tapped!', res);
            });


        };

        /* ERROR POPUP */
        $scope.openErrorPopup = function (message) {
            var errorAlert = $ionicPopup.alert({
                title: '<h2>Something Went Wrong!</h2>',
                template: message
            });
        };


        /* TOAST NOTIFICATION */
        $scope.sendNotification = function () {
            if (window.Notification && Notification.permission === "granted") {
                var n = new Notification("Geo Diary", {body: "Current Location Acquired."});
            }
            window.navigator.vibrate([200, 100, 400]);
        };

        /* GETTING GEOLOCATION */
        $scope.getGeoPosition = function () {
            //console.log('in getGeoPosition()');
            if (!navigator.geolocation) {
                alert('Geolocation is not supported in your device :(');
                return;
            }

            var geoOptions = {
                enableHighAccuracy: true,
                maximumAge : 30000
            };

            $scope.message = 'Finding Your Location...';
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);

            function geoError (error) {
                //console.log('in geoError()');
               // console.log(error);
                $scope.message = '';
                $scope.openErrorPopup('Oopzz, Failed to get your current location :( Please check if you have your location service turned on.\n If the problem still exists please contact us. Submit your error report to <a href="mailto:kvkrusl@gmail.com">kvkrusl@gmail.com</a>\nWe are sorry for the inconvenience caused.');
            }

            function geoSuccess(position) {
                //console.log('in geoSuccess()');
                $scope.message = ''; // Clear message
                $scope.lat = position.coords.latitude;
                $scope.lon = position.coords.longitude;
                $scope.currentPosition = position;
                $scope.sendNotification(); // Notifiy user by vibrating
                $scope.openSavePopup(); // prompt for save
            }
        };

    })

    .controller('PlaylistsCtrl', function ($scope) {

    })

    .controller('DetailsCtrl', function ($scope, $stateParams) {

    });
