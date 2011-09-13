
all: prod

data: web/data/schedule.json

prod: web/cache.manifest web/js/VERSION.js data

web/cache.manifest: web/cache.manifest.template force-run
	# forcing cache.manifest rebuild to add new revision token
	sed -e 's/REVTOKEN/'"$$(date)"'/' web/cache.manifest.template > $@

web/js/VERSION.js: web/js/VERSION.js.template force-run
	sed -e 's/%%APP_VERSION%%/'"$$(git rev-parse HEAD) $$(date)"'/' web/js/VERSION.js.template > $@

web/data/schedule.json: force-run
	mkdir -p $$(dirname $@)
	curl -H 'Accept: application/json' http://pygotham.org/talkvote/full_schedule \
		| sed -e 's/\(2011-09-[0-9][0-9]\) \([0-9][0-9]:[0-9][0-9]:[0-9][0-9]\)/\1T\2-04:00/g' \
		> $@

web/data/talks.json: force-run
	mkdir -p $$(dirname $@)
	curl http://pygotham.org/talkvote/scheduled_talks/ \
		| python data/convert.py \
		> $@

clean:
	find . -type f -name '*.pyc' | xargs rm -f
	rm -f web/data/talks.json web/data/schedule.json
	rm -f web/cache.manifest
	rm -f web/js/VERSION.js

force-run: /dev/null

