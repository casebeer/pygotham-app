
all: web/data/talks.json web/cache.manifest

web/cache.manifest: web/cache.manifest.template force-run
	# forcing cache.manifest rebuild to add new revision token
	sed -e 's/REVTOKEN/'"$$(date)"'/' web/cache.manifest.template > $@

web/data/talks.json: force-run
	curl http://pygotham.org/talkvote/scheduled_talks/ \
		| python data/convert.py \
		> $@

clean:
	find . -type f -name '*.pyc' | xargs rm -f
	rm -f web/data/talks.json
	rm -f web/cache.manifest

force-run: /dev/null
