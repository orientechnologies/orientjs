####3.0.3

###Enhancements

* [#282](https://github.com/orientechnologies/orientjs/issues/282) Added SSL support

###Bug Fixes

* [#355](https://github.com/orientechnologies/orientjs/issues/355) Fixed typo with notNull property

####3.0.2

###Bug Fixes

* [#353](https://github.com/orientechnologies/orientjs/issues/353) Fixed issue with property creation.
* [#345](https://github.com/orientechnologies/orientjs/issues/354) Fixed issue with client close after an error.

####3.0.1

###Bug Fixes

* [#345](https://github.com/orientechnologies/orientjs/issues/345) Fixed transaction builder in 3.0.x

####3.0.0

### New Feature

* Live Query With Observable [#236](https://github.com/orientechnologies/orientjs/issues/236)
* New APIs for OrientDB 3.0.x protocol [here](https://orientdb.org/docs//3.0.x/orientjs/OrientJS.html)

####2.2.5

###Enhancements

* [#181](https://github.com/orientechnologies/orientjs/issues/181) Removed cluster_id param in API `db.record.create` and let the db chose the best cluster instead of the default one

####2.2.4

###Bug Fixes

* [#218](https://github.com/orientechnologies/orientjs/issues/218) Fixed Resolve References Duplicate without rids

####2.2.3

###Bug Fixes

* [#192](https://github.com/orientechnologies/orientjs/issues/192) Fixed class name caching
* [#199](https://github.com/orientechnologies/orientjs/issues/199) Fixed multiple returns
* [#4485](https://github.com/orientechnologies/orientdb/issues/4485) Added More Tests for custom returns
 
###New Features

* [#200](https://github.com/orientechnologies/orientjs/issues/200) Added Extra parameter `input` to the endQuery

####2.2.2

###Bug Fixes

* [#187](https://github.com/orientechnologies/orientjs/issues/187) Fixed native deserializer on Decimal Type
* [#191](https://github.com/orientechnologies/orientjs/issues/191) Fixed distributed support in 2.2.x

###New Features

* [#190](https://github.com/orientechnologies/orientjs/pull/190) Raw Expressions [docs](https://github.com/orientechnologies/orientdb-docs/blob/master/OrientJS-Query-Insert.md#raw-expressions)
