using _3dViewer.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace _3dViewer.ViewModels
{
    public class SceneViewModel
    {
        public Scenes scene { get; set; }
        public IQueryable<Annotations> annotations { get; set; }
        public IEnumerable<ModelsList> modelsLists { get; set; }
    }
}
