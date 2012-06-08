
all: dependencies build

dependencies: assets/www 

assets/www: ../../web
	mkdir -p assets
	rsync -av ../../web/ assets/www/

build: dependencies
	ant release
install: dependencies
	ant release install
debug: dependencies
	ant debug
debug-install: dependencies
	ant debug install

clean:
	rm -rf assets/www
	ant clean
