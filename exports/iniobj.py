def split_obj_file(input_file, vertices_file, normals_file, indices_file, lines_file=None):
    with open(input_file, 'r') as infile, \
         open(vertices_file, 'w') as vfile, \
         open(normals_file, 'w') as vnfile, \
         open(indices_file, 'w') as ifile:
        
        # Only open lines file if it's provided
        lfile = open(lines_file, 'w') if lines_file else None

        for line in infile:
            components = line.strip().split()

            # Skip empty lines
            if not components:
                continue

            # Process vertices (lines starting with 'v')
            if components[0] == 'v' and len(components) == 4:
                vfile.write(line)

            # Process vertex normals (lines starting with 'vn')
            elif components[0] == 'vn':
                vnfile.write(line)

            # Process faces (lines starting with 'f')
            elif components[0] == 'f':
                ifile.write(line)

            # Process lines (if lines file provided)
            elif components[0] == 'l' and lfile:
                lfile.write(line)
        
        # Close the lines file if opened
        if lfile:
            lfile.close()

# Nama file input dan output
input_obj = 'payung1.obj'
output_vertices = 'vertices.txt'
output_normals = 'normals.txt'
output_faces = 'indices.txt'
output_lines = 'lines.txt'

# Panggil fungsi untuk memisahkan file OBJ
split_obj_file(input_obj, output_vertices, output_normals, output_faces, output_lines)