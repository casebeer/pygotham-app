
all:

data/talks.json: force-run
	curl http://pygotham.org/talkvote/scheduled_talks/ \
		| python data/convert.py \
		> $@

clean:
	find . -type f -name '*.pyc' | xargs rm -f
	rm -f data/talks.json

force-run: /dev/null
