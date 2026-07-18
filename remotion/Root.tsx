import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from '../src/remotion/MainComposition';
import { sampleProject } from '../src/sampleProject';
import type { Project } from '../src/types';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={MainComposition as React.FC<{ project: Project }>}
      defaultProps={{ project: sampleProject }}
      durationInFrames={sampleProject.durationInFrames}
      fps={sampleProject.fps}
      width={sampleProject.width}
      height={sampleProject.height}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.project.durationInFrames,
        fps: props.project.fps,
        width: props.project.width,
        height: props.project.height,
      })}
    />
  );
};
