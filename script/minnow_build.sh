rm -r dist/minnow-compiled.js &&

closure-library/closure/bin/build/closurebuilder.py \
  --root=closure-library/ \
  --root=minnow/ \
  --namespace="minnow" \
  --output_mode=compiled \
  --compiler_jar=compiler/compiler.jar \
  --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" \
  > dist/minnow-compiled.js &&

wc -c dist/minnow-compiled.js