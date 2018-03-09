
####2.2.9

### Bug Fixes

* Fixed issue on Server::connect. Added missing paramenter useToken

####2.2.8

### Bug Fixes

* [#297](https://github.com/orientechnologies/orientjs/issues/297) Session management issue with token

### PR Merged

* [#292](https://github.com/orientechnologies/orientjs/pull/292) Added superclasses property 


####2.2.7

### Bug Fixes

* [#279](https://github.com/orientechnologies/orientjs/issues/279), [#172](https://github.com/orientechnologies/orientjs/issues/172) Server session management issue.

###Enhancements

* [#275](https://github.com/orientechnologies/orientjs/issues/275) Migration support when using Typescript

####2.2.6

### Bug Fixes

* [#259](https://github.com/orientechnologies/orientjs/issues/259), [#261](https://github.com/orientechnologies/orientjs/issues/261), [#262](https://github.com/orientechnologies/orientjs/issues/262) Live Query Fix

####2.2.5

###Enhancements

* [#181](https://github.com/orientechnologies/orientjs/issues/181) Removed cluster_id param in API `db.record.create` and let the db chose the best cluster instead of the default one

### Bug Fixes

* [#245](https://github.com/orientechnologies/orientjs/issues/245) Fixed MigrationManager.listApplied
* [#243](https://github.com/orientechnologies/orientjs/issues/243) Fixed Multiple live query on the same db object.

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
