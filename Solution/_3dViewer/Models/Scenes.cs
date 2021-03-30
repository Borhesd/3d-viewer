using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace _3dViewer.Models
{
    public partial class Scenes
    {
        public Scenes()
        {
            Annotations = new HashSet<Annotations>();
            Permissions = new HashSet<Permissions>();
        }

        public int Id { get; set; }
        public string Name { get; set; }
        [DataType(DataType.MultilineText)]
        public string Description { get; set; }
        [DataType(DataType.MultilineText)]
        public string Source { get; set; }
        public bool Ispublic { get; set; }

        public virtual ICollection<Annotations> Annotations { get; set; }
        public virtual ICollection<Permissions> Permissions { get; set; }
    }
}
